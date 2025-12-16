/**
 * Integration tests for ERP Integration API mapping configuration
 *
 * These tests validate that the sample mapping configuration correctly
 * transforms customer and order data into epilot contact and order entities.
 *
 * The tests use the simulateMappingV2 endpoint to verify mappings without persisting data.
 */

import { describe, expect, it, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getClient } from '@epilot/erp-integration-client'

// Increase timeout for API integration tests
const TEST_TIMEOUT = 30000; // 30 seconds

// Get API token from environment variable
const API_TOKEN = process.env.EPILOT_API_TOKEN;

if (!API_TOKEN) {
  throw new Error(
    'EPILOT_API_TOKEN environment variable is required. ' +
    'Please create a .env file with your epilot API token.'
  );
}

const erpClient = getClient();
erpClient.defaults.headers.common['Authorization'] = `Bearer ${API_TOKEN}`;
erpClient.defaults.validateStatus = () => true;

const loadEventConfig = (eventName: string): any => {
  const mappingPath = join(__dirname, `../samples/mapping.${eventName}.json`);
  const mappingContent = readFileSync(mappingPath, 'utf-8');
  return JSON.parse(mappingContent);
};

const loadInboundEvent = (eventName: string): any => {
  const eventPath = join(__dirname, `../samples/payload.${eventName}.json`);
  const eventContent = readFileSync(eventPath, 'utf-8');
  return JSON.parse(eventContent);
};

describe('Sample Mappings', () => {
  beforeAll(() => {
    vi.setConfig({ testTimeout: TEST_TIMEOUT });
  });

  describe('CustomerChanged', () => {
    it('should map to contact entity', async () => {
      const eventConfig = loadEventConfig('CustomerChanged');
      const event = loadInboundEvent('customer');

      const response = await erpClient.simulateMappingV2(null, {
        event_configuration: eventConfig,
        format: 'json',
        payload: event,
      });

      const contactUpdate = response.data.entity_updates.find(
        (update: { entity_slug: string }) => update.entity_slug === 'contact'
      );

      expect(contactUpdate).toMatchObject({
        entity_slug: 'contact',
        attributes: {
          external_id: 'CUST-9876',
          first_name: 'Max',
          last_name: 'Mustermann',
          company_name: 'Acme Corporation',
          customer_type: 'business',
          tax_id: 'DE123456789',
          status: 'active',
          full_name: 'Acme Corporation',
          email: [
            {
              _tags: ['Primary'],
              email: 'max.mustermann@acme.com'
            }
          ],
          phone: [
            {
              _tags: ['Primary'],
              phone: '+49 89 12345678'
            },
            {
              _tags: ['Mobile'],
              phone: '+49 176 98765432'
            }
          ],
          address: [
            {
              _tags: ['Primary Address'],
              street: 'Hauptstraße 123',
              postal_code: '80331',
              city: 'Munich',
              country: 'Germany'
            },
            {
              _tags: ['Billing Address'],
              street: 'Nebenstraße 456',
              postal_code: '10115',
              city: 'Berlin',
              country: 'Germany'
            }
          ],
          account: {
            $relation: {
              _set: expect.any(Array)
            }
          }
        }
      });
    });

    it('should map to account entity', async () => {
      const eventConfig = loadEventConfig('CustomerChanged');
      const event = loadInboundEvent('customer');

      const response = await erpClient.simulateMappingV2(null, {
        event_configuration: eventConfig,
        format: 'json',
        payload: event,
      });

      const accountUpdate = response.data.entity_updates.find(
        (update: { entity_slug: string }) => update.entity_slug === 'account'
      );

      expect(accountUpdate).toMatchObject({
        entity_slug: 'account',
        attributes: {
          customer_number: 'CUST-9876',
          name: 'Acme Corporation',
          tax_id: 'DE123456789',
          website: 'https://www.acme-corp.example',
          industry: ['Technology', 'Solar Energy'],
          company_size: '100-249',
          email: [
            {
              _tags: ['Primary'],
              email: 'max.mustermann@acme.com'
            }
          ],
          phone: [
            {
              _tags: ['Primary'],
              phone: '+49 89 12345678'
            },
            {
              _tags: ['Mobile'],
              phone: '+49 176 98765432'
            }
          ],
          address: [
            {
              _tags: ['Primary Address'],
              street: 'Hauptstraße 123',
              postal_code: '80331',
              city: 'Munich',
              country: 'Germany'
            },
            {
              _tags: ['Billing Address'],
              street: 'Nebenstraße 456',
              postal_code: '10115',
              city: 'Berlin',
              country: 'Germany'
            }
          ],
          payment: [
            {
              type: 'payment_sepa',
              data: {
                iban: 'DE89370400440532013000',
                bic_number: 'DEUTDEFF',
                fullname: 'Acme Corporation'
              }
            }
          ],
          contacts: {
            $relation: {
              _set: expect.any(Array)
            }
          }
        }
      });
    });

    it('should map to billing_account entity', async () => {
      const eventConfig = loadEventConfig('CustomerChanged');
      const event = loadInboundEvent('customer');

      const response = await erpClient.simulateMappingV2(null, {
        event_configuration: eventConfig,
        format: 'json',
        payload: event,
      });

      const billingAccountUpdate = response.data.entity_updates.find(
        (update: { entity_slug: string }) => update.entity_slug === 'billing_account'
      );

      expect(billingAccountUpdate).toMatchObject({
        entity_slug: 'billing_account',
        attributes: {
          external_id: 'CUST-9876',
          billing_account_number: 'CUST-9876',
          billing_address: {
            _tags: ['Billing'],
            street: 'Nebenstraße 456',
            postal_code: '10115',
            city: 'Berlin',
            country: 'Germany'
          },
          payment_method: [
            {
              type: 'payment_sepa',
              data: {
                iban: 'DE89370400440532013000',
                bic_number: 'DEUTDEFF',
                fullname: 'Acme Corporation'
              }
            }
          ],
          billing_contact: {
            $relation: {
              _set: expect.any(Array)
            }
          }
        }
      });
    });
  });

  describe('OrderChanged', () => {
    it('should map to contact entity', async () => {
      const eventConfig = loadEventConfig('OrderChanged');
      const event = loadInboundEvent('order');

      const response = await erpClient.simulateMappingV2(null, {
        event_configuration: eventConfig,
        format: 'json',
        payload: event,
      });

      const contactUpdate = response.data.entity_updates.find(
        (update: { entity_slug: string }) => update.entity_slug === 'contact'
      );

      expect(contactUpdate).toMatchObject({
        entity_slug: 'contact',
        attributes: {
          external_id: 'CUST-9876',
          full_name: 'Acme Corporation',
          email: [
            {
              _tags: ['Primary'],
              email: 'contact@acme.com'
            }
          ],
          phone: [
            {
              _tags: ['Primary'],
              phone: '+49 89 12345678'
            }
          ]
        }
      });
    });

    it('should map to order entity', async () => {
      const eventConfig = loadEventConfig('OrderChanged');
      const event = loadInboundEvent('order');

      const response = await erpClient.simulateMappingV2(null, {
        event_configuration: eventConfig,
        format: 'json',
        payload: event,
      });

      const orderUpdate = response.data.entity_updates.find(
        (update: { entity_slug: string }) => update.entity_slug === 'order'
      );

      expect(orderUpdate).toMatchObject({
        entity_slug: 'order',
        attributes: {
          external_id: 'ORD-2024-12345',
          order_number: 'ORD-2024-12345',
          order_date: '2024-10-21T10:30:00Z',
          status: 'pending',
          delivery_date: '2024-11-15',
          total_amount_decimal: '3499.90',
          total_amount: '349990',
          total_amount_currency: 'EUR',
          item_count: 2,
          shipping_address: [
            {
              street: 'Hauptstraße 123',
              postal_code: '80331',
              city: 'Munich',
              country: 'Germany'
            }
          ],
          order_items: [
            {
              _tags: ['PROD-001'],
              product_id: 'PROD-001',
              product_name: 'Solar Panel 400W',
              quantity: '10',
              unit_price: '299.99',
              total_price: '2999.90'
            },
            {
              _tags: ['PROD-002'],
              product_id: 'PROD-002',
              product_name: 'Installation Service',
              quantity: '1',
              unit_price: '500.00',
              total_price: '500.00'
            }
          ],
          customer: {
            $relation: {
              _set: expect.any(Array)
            }
          }
        }
      });
    });
  });
});
