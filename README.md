# ERP Toolkit Mapping Examples

This repository demonstrates how to use [epilot's ERP Integration Toolkit](https://docs.epilot.io/docs/integrations/erp-toolkit-mapping) mapping configuration (v2.0) to transform ERP system events into epilot entities.

## Resources

- **[ERP Toolkit Mapping Documentation](https://docs.epilot.io/docs/integrations/erp-toolkit-mapping)** - Complete guide on mapping configuration
- **[Interactive Mapping Playground](https://portal.epilot.cloud/app/integrations)** - Test and debug your mappings in the epilot portal
- **[epilot data model](https://docs.epilot.io/docs/entities/core-entities)** - epilot core entities documented with full json schema and examples
- **[JSONata Language Reference](https://docs.jsonata.org/)** - Learn about JSONata expressions used in mappings
- **[epilot API Documentation](https://docs.epilot.io/api)** - API reference
- **[epilot SDK](https://github.com/epilot-dev/sdk-js)** - JavaScript/TypeScript SDK

## What's Included

This repository contains complete, working examples of:

### CustomerChanged Event
Maps an ERP customer update to three epilot entities:
- **Contact** - Customer contact information
- **Account** - Business account details
- **Billing Account** - Payment and billing information

### OrderChanged Event
Maps an ERP order to two epilot entities:
- **Contact** - Customer from order
- **Order** - Order details with line items

### ContractChanged Event
Maps an ERP power contract with meter data to multiple epilot entities:
- **Contract** - Service agreement with tariff details
- **Meter** - Smart meter device information
- **Meter Counter** - Peak (HT) and off-peak (NT) counters for dual-tariff metering
- **Meter Readings** - 4 monthly readings demonstrating the `meter_readings` mapping feature

## Repository Structure

```
.
├── samples/
│   ├── mapping.CustomerChanged.json    # CustomerChanged event configuration
│   ├── mapping.OrderChanged.json       # OrderChanged event configuration
│   ├── mapping.ContractChanged.json    # ContractChanged event configuration (with meter_readings)
│   ├── payload.customer.json           # Sample CustomerChanged event
│   ├── payload.order.json              # Sample OrderChanged event
│   └── payload.contract.json           # Sample ContractChanged event (with meter readings)
├── tests/
│   └── sample-mappings.test.ts         # Integration tests with expected outputs
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- An epilot API token

### Installation

```bash
# Clone the repository
git clone https://github.com/epilot-dev/erp-toolkit-mapping-examples.git
cd erp-toolkit-mapping-examples

# Install dependencies
npm install
```

### Set Up API Token

Create a `.env` file in the project root:

```bash
# Get your API token from https://portal.epilot.cloud/app/settings/tokens
EPILOT_API_TOKEN=your_api_token_here
```

> **Note:** Never commit your `.env` file to version control!

### Run the Tests

```bash
# Run all mapping tests
npm test

# Run tests in watch mode
npm run test:watch
```

The tests will validate that the sample events are correctly transformed into epilot entities according to the mapping configuration.

## Exploring the Examples

### 1. Review the Mapping Configurations

Each event type has its own mapping configuration file in `samples/`:

- [`mapping.CustomerChanged.json`](./samples/mapping.CustomerChanged.json) - Customer to contact, account, and billing account
- [`mapping.OrderChanged.json`](./samples/mapping.OrderChanged.json) - Order with line items and customer relation
- [`mapping.ContractChanged.json`](./samples/mapping.ContractChanged.json) - Contract with meter, counters, and meter readings

Key concepts demonstrated:
- **Entity mapping** with unique identifiers
- **JSONata expressions** for complex transformations
- **Multi-value attributes** (arrays with tags)
- **Entity relations** with `_set` operation
- **Conditional entity creation**
- **Array iteration** with entity-level `jsonataExpression`
- **Meter readings mapping** for energy/utility data

### 2. Examine Sample Payloads

- [`payload.customer.json`](./samples/payload.customer.json) - Business customer with addresses, contacts, and payment info
- [`payload.order.json`](./samples/payload.order.json) - Order with line items and customer reference
- [`payload.contract.json`](./samples/payload.contract.json) - Power contract with smart meter, dual-tariff counters, and monthly readings

### 3. Check Expected Outputs

The test file [`tests/sample-mappings.test.ts`](./tests/sample-mappings.test.ts) shows the exact output expected for each entity using `toMatchObject` assertions. This serves as living documentation of the transformation.

## Key Mapping Features Demonstrated

### Field Mapping Types

```json
{
  "attribute": "external_id",
  "field": "customerId"
}
```

```json
{
  "attribute": "full_name",
  "jsonataExpression": "customerType = 'business' ? companyName : (firstName & ' ' & lastName)"
}
```

### Multi-Value Attributes with Tags

```json
{
  "attribute": "email",
  "jsonataExpression": "$exists(email) ? [{ \"_tags\": [\"Primary\"], \"email\": email }] : undefined"
}
```

### Entity Relations

```json
{
  "attribute": "account",
  "relations": {
    "operation": "_set",
    "items": [{
      "entity_schema": "account",
      "unique_ids": [{
        "attribute": "customer_number",
        "jsonataExpression": "customerId"
      }]
    }]
  }
}
```

### Conditional Entity Creation

```json
{
  "entity_schema": "account",
  "condition": "customerType = 'business'",
  "fields": [...]
}
```

### Array Iteration (Multiple Entities from Array)

```json
{
  "entity_schema": "meter_counter",
  "jsonataExpression": "meter.counters",
  "unique_ids": ["external_id"],
  "fields": [
    { "attribute": "external_id", "field": "counterId" },
    { "attribute": "tariff_type", "field": "tariffType" }
  ]
}
```

### Meter Readings Mapping

```json
{
  "meter_readings": [{
    "jsonataExpression": "meterReadings",
    "meter": {
      "unique_ids": [{ "attribute": "external_id", "field": "meterId" }]
    },
    "meter_counter": {
      "unique_ids": [{ "attribute": "external_id", "field": "counterId" }]
    },
    "fields": [
      { "attribute": "external_id", "field": "readingId" },
      { "attribute": "timestamp", "field": "timestamp" },
      { "attribute": "value", "jsonataExpression": "$string(value)" },
      { "attribute": "source", "field": "source" }
    ]
  }]
}
```

## Understanding the Tests

Each test validates the complete transformation for one entity using the `simulateMappingV2` endpoint:

```typescript
it('should map to contact entity', async () => {
  const eventConfig = loadEventConfig('CustomerChanged');
  const event = loadInboundEvent('customer');

  const response = await erpClient.simulateMappingV2(null, {
    event_configuration: eventConfig,
    format: 'json',
    payload: event,
  });

  const contactUpdate = response.data.entity_updates.find(
    (update) => update.entity_slug === 'contact'
  );

  expect(contactUpdate).toMatchObject({
    entity_slug: 'contact',
    attributes: {
      external_id: 'CUST-9876',
      full_name: 'Acme Corporation',
      email: [{ _tags: ['Primary'], email: 'max.mustermann@acme.com' }],
      // ... complete expected structure
    }
  });
});
```

For meter readings:

```typescript
it('should map 4 meter readings', async () => {
  const response = await erpClient.simulateMappingV2(null, {
    event_configuration: eventConfig,
    format: 'json',
    payload: event,
  });

  const meterReadings = response.data.meter_readings_updates;

  expect(meterReadings).toHaveLength(4);
  expect(meterReadings[0]).toMatchObject({
    meter: { $entity_unique_ids: { external_id: 'MTR-001234' } },
    meter_counter: { $entity_unique_ids: { external_id: 'CNT-001234-HT' } },
    attributes: {
      external_id: 'RDG-2024-001',
      timestamp: '2024-10-01T00:00:00Z',
      value: '12345.67',
      source: 'ERP'
    }
  });
});
```

## Customizing for Your Use Case

1. **Create a new mapping** file in `samples/mapping.YourEvent.json`
2. **Add sample payload** in `samples/payload.yourevent.json`
3. **Run tests** to validate your mappings work correctly
4. **Deploy** the mapping configuration to your epilot organization

## Common Use Cases

### Adding a New Field

```json
{
  "attribute": "my_custom_field",
  "field": "sourceField"
}
```

### Conditional Field Mapping

```json
{
  "attribute": "company_name",
  "jsonataExpression": "$exists(companyName) ? companyName : undefined"
}
```

### Array Transformation

```json
{
  "attribute": "order_items",
  "jsonataExpression": "items.{ \"product_id\": productId, \"quantity\": $string(quantity) }"
}
```

### Adding Relations

```json
{
  "attribute": "related_entity",
  "relations": {
    "operation": "_set",
    "items": [{
      "entity_schema": "target_schema",
      "unique_ids": [{ "attribute": "unique_field", "field": "sourceField" }]
    }]
  }
}
```
