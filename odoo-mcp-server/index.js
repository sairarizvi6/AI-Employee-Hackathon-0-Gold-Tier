#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069';
const ODOO_DB = process.env.ODOO_DB || 'odoo';
const ODOO_USERNAME = process.env.ODOO_USERNAME || 'admin';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || 'admin';

class OdooMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'odoo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.uid = null;
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async authenticate() {
    if (this.uid) return this.uid;

    try {
      const response = await axios.post(
        `${ODOO_URL}/web/session/authenticate`,
        {
          jsonrpc: '2.0',
          params: {
            db: ODOO_DB,
            login: ODOO_USERNAME,
            password: ODOO_PASSWORD,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.result && response.data.result.uid) {
        this.uid = response.data.result.uid;
        this.sessionId = response.headers['set-cookie'];
        return this.uid;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Odoo authentication error:', error.message);
      throw error;
    }
  }

  async callOdooMethod(model, method, args = [], kwargs = {}) {
    await this.authenticate();

    try {
      const response = await axios.post(
        `${ODOO_URL}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: model,
            method: method,
            args: args,
            kwargs: kwargs,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: this.sessionId,
          },
        }
      );

      return response.data.result;
    } catch (error) {
      console.error(`Odoo method call error (${model}.${method}):`, error.message);
      throw error;
    }
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'odoo_create_invoice',
          description: 'Create a draft invoice in Odoo (requires approval before posting)',
          inputSchema: {
            type: 'object',
            properties: {
              partner_name: {
                type: 'string',
                description: 'Customer name',
              },
              invoice_lines: {
                type: 'array',
                description: 'Invoice line items',
                items: {
                  type: 'object',
                  properties: {
                    product_name: { type: 'string' },
                    quantity: { type: 'number' },
                    price_unit: { type: 'number' },
                    description: { type: 'string' },
                  },
                  required: ['product_name', 'quantity', 'price_unit'],
                },
              },
            },
            required: ['partner_name', 'invoice_lines'],
          },
        },
        {
          name: 'odoo_get_invoices',
          description: 'Get list of invoices with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                description: 'Invoice state: draft, posted, cancel',
                enum: ['draft', 'posted', 'cancel'],
              },
              limit: {
                type: 'number',
                description: 'Maximum number of invoices to return',
                default: 10,
              },
            },
          },
        },
        {
          name: 'odoo_get_partners',
          description: 'Get list of customers/partners',
          inputSchema: {
            type: 'object',
            properties: {
              search_term: {
                type: 'string',
                description: 'Search by name or email',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of partners to return',
                default: 10,
              },
            },
          },
        },
        {
          name: 'odoo_create_partner',
          description: 'Create a new customer/partner',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Partner name' },
              email: { type: 'string', description: 'Email address' },
              phone: { type: 'string', description: 'Phone number' },
              street: { type: 'string', description: 'Street address' },
              city: { type: 'string', description: 'City' },
              country_code: { type: 'string', description: 'Country code (e.g., US)' },
            },
            required: ['name'],
          },
        },
        {
          name: 'odoo_get_revenue_summary',
          description: 'Get revenue summary for a date range',
          inputSchema: {
            type: 'object',
            properties: {
              date_from: {
                type: 'string',
                description: 'Start date (YYYY-MM-DD)',
              },
              date_to: {
                type: 'string',
                description: 'End date (YYYY-MM-DD)',
              },
            },
            required: ['date_from', 'date_to'],
          },
        },
        {
          name: 'odoo_get_products',
          description: 'Get list of products/services',
          inputSchema: {
            type: 'object',
            properties: {
              search_term: {
                type: 'string',
                description: 'Search by product name',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of products to return',
                default: 10,
              },
            },
          },
        },
        {
          name: 'odoo_create_product',
          description: 'Create a new product/service',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Product name' },
              list_price: { type: 'number', description: 'Sale price' },
              type: {
                type: 'string',
                description: 'Product type',
                enum: ['consu', 'service', 'product'],
                default: 'service',
              },
              description: { type: 'string', description: 'Product description' },
            },
            required: ['name', 'list_price'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'odoo_create_invoice':
            return await this.createInvoice(args);
          case 'odoo_get_invoices':
            return await this.getInvoices(args);
          case 'odoo_get_partners':
            return await this.getPartners(args);
          case 'odoo_create_partner':
            return await this.createPartner(args);
          case 'odoo_get_revenue_summary':
            return await this.getRevenueSummary(args);
          case 'odoo_get_products':
            return await this.getProducts(args);
          case 'odoo_create_product':
            return await this.createProduct(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async createInvoice(args) {
    const { partner_name, invoice_lines } = args;

    // Find or create partner
    const partners = await this.callOdooMethod('res.partner', 'search_read', [
      [['name', '=', partner_name]],
      ['id', 'name'],
    ]);

    let partnerId;
    if (partners.length > 0) {
      partnerId = partners[0].id;
    } else {
      partnerId = await this.callOdooMethod('res.partner', 'create', [
        { name: partner_name },
      ]);
    }

    // Prepare invoice lines
    const lines = [];
    for (const line of invoice_lines) {
      // Find or create product
      const products = await this.callOdooMethod('product.product', 'search_read', [
        [['name', '=', line.product_name]],
        ['id'],
      ]);

      let productId;
      if (products.length > 0) {
        productId = products[0].id;
      } else {
        productId = await this.callOdooMethod('product.product', 'create', [
          {
            name: line.product_name,
            list_price: line.price_unit,
            type: 'service',
          },
        ]);
      }

      lines.push([
        0,
        0,
        {
          product_id: productId,
          quantity: line.quantity,
          price_unit: line.price_unit,
          name: line.description || line.product_name,
        },
      ]);
    }

    // Create invoice in draft state
    const invoiceId = await this.callOdooMethod('account.move', 'create', [
      {
        partner_id: partnerId,
        move_type: 'out_invoice',
        invoice_line_ids: lines,
      },
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              invoice_id: invoiceId,
              partner_name: partner_name,
              state: 'draft',
              message: 'Invoice created in DRAFT state. Requires approval to post.',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getInvoices(args) {
    const { state, limit = 10 } = args;

    const domain = [];
    if (state) {
      domain.push(['state', '=', state]);
    }
    domain.push(['move_type', '=', 'out_invoice']);

    const invoices = await this.callOdooMethod('account.move', 'search_read', [
      domain,
      ['name', 'partner_id', 'amount_total', 'state', 'invoice_date', 'invoice_date_due'],
      0,
      limit,
      'invoice_date desc',
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ invoices, count: invoices.length }, null, 2),
        },
      ],
    };
  }

  async getPartners(args) {
    const { search_term, limit = 10 } = args;

    const domain = [];
    if (search_term) {
      domain.push(['name', 'ilike', search_term]);
    }

    const partners = await this.callOdooMethod('res.partner', 'search_read', [
      domain,
      ['name', 'email', 'phone', 'street', 'city', 'country_id'],
      0,
      limit,
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ partners, count: partners.length }, null, 2),
        },
      ],
    };
  }

  async createPartner(args) {
    const partnerId = await this.callOdooMethod('res.partner', 'create', [args]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              partner_id: partnerId,
              name: args.name,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getRevenueSummary(args) {
    const { date_from, date_to } = args;

    const invoices = await this.callOdooMethod('account.move', 'search_read', [
      [
        ['move_type', '=', 'out_invoice'],
        ['state', '=', 'posted'],
        ['invoice_date', '>=', date_from],
        ['invoice_date', '<=', date_to],
      ],
      ['amount_total', 'invoice_date', 'partner_id'],
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount_total, 0);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              date_from,
              date_to,
              total_revenue: totalRevenue,
              invoice_count: invoices.length,
              invoices: invoices,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getProducts(args) {
    const { search_term, limit = 10 } = args;

    const domain = [];
    if (search_term) {
      domain.push(['name', 'ilike', search_term]);
    }

    const products = await this.callOdooMethod('product.product', 'search_read', [
      domain,
      ['name', 'list_price', 'type', 'description'],
      0,
      limit,
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ products, count: products.length }, null, 2),
        },
      ],
    };
  }

  async createProduct(args) {
    const productId = await this.callOdooMethod('product.product', 'create', [args]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              product_id: productId,
              name: args.name,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Odoo MCP Server running on stdio');
  }
}

const server = new OdooMCPServer();
server.run().catch(console.error);
