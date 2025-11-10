# ERP Toolkit Mapping Examples

This repository demonstrates how to use [epilot's ERP Integration Toolkit](https://docs.epilot.io/docs/integrations/erp-toolkit-mapping) mapping configuration (v2.0) to transform ERP system events into epilot entities.

## 📚 Resources

- **[ERP Toolkit Mapping Documentation](https://docs.epilot.io/docs/integrations/erp-toolkit-mapping)** - Complete guide on mapping configuration
- **[Interactive Mapping Playground](https://portal.epilot.cloud/app/integrations)** - Test and debug your mappings in the epilot portal
- **[epilot data model](https://docs.epilot.io/docs/entities/core-entities)** - epilot core entities documented with full json schema and examples
- **[JSONata Language Reference](https://docs.jsonata.org/)** - Learn about JSONata expressions used in mappings
- **[epilot API Documentation](https://docs.epilot.io/api)** - API reference
- **[epilot SDK](https://github.com/epilot-dev/sdk-js)** - JavaScript/TypeScript SDK

## 🎯 What's Included

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

## 📁 Repository Structure

```
.
├── samples/
│   ├── mapping.json                    # Mapping configuration (v2.0)
│   ├── payload.customer.json           # Sample CustomerChanged event
│   └── payload.order.json              # Sample OrderChanged event
├── tests/
│   └── sample-mappings.test.ts         # Integration tests with expected outputs
├── package.json
└── README.md
```

## 🚀 Getting Started

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

## 🔍 Exploring the Examples

### 1. Review the Mapping Configuration

Open [`samples/mapping.json`](./samples/mapping.json) to see the complete mapping configuration. Key concepts demonstrated:

- **Event-based mapping** (v2.0 format)
- **Multiple entities per event**
- **JSONata expressions** for complex transformations
- **Multi-value attributes** (arrays with tags)
- **Entity relations** with `_set` operation
- **Conditional entity creation**

### 2. Examine Sample Payloads

- [`samples/payload.customer.json`](./samples/payload.customer.json) - Business customer with addresses, contacts, and payment info
- [`samples/payload.order.json`](./samples/payload.order.json) - Order with line items and customer reference

### 3. Check Expected Outputs

The test file [`tests/sample-mappings.test.ts`](./tests/sample-mappings.test.ts) shows the exact output expected for each entity using `toMatchObject` assertions. This serves as living documentation of the transformation.

## 📖 Key Mapping Features Demonstrated

### Field Mapping Types

```json
{
  "attribute": "external_id",
  "field": "customerId"                    // ✅ Direct field mapping
}
```

```json
{
  "attribute": "full_name",
  "jsonataExpression": "customerType = 'business' ? companyName : (firstName & ' ' & lastName)"
}                                          // ✅ JSONata transformation
```

### Multi-Value Attributes with Tags

```json
{
  "attribute": "email",
  "jsonataExpression": "$exists(email) ? [{ \"_tags\": [\"Primary\"], \"email\": email }] : undefined"
}                                          // ✅ Array with tags
```

### Entity Relations

```json
{
  "attribute": "account",
  "relations": {
    "operation": "_set",                   // ✅ Relation operation
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
  "condition": "customerType = 'business'", // ✅ Only create for business customers
  "fields": [...]
}
```

## 🧪 Understanding the Tests

Each test validates the complete transformation for one entity:

```typescript
it('should map to contact entity', async () => {
  const response = await erpClient.simulateMapping(null, {
    mapping_configuration: mappingConfig,
    object_type: 'CustomerChanged',
    format: 'json',
    payload: JSON.stringify(event),
  });

  const contactUpdate = response.data.entity_updates.find(
    (update) => update.entity_slug === 'contact'
  );

  // Expected output documented here
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

## 🔧 Customizing for Your Use Case

1. **Modify the mapping** in `samples/mapping.json` to match your ERP data structure
2. **Update sample payloads** in `samples/*.json` with your actual event format
3. **Run tests** to validate your mappings work correctly
4. **Deploy** the mapping configuration to your epilot organization

## 📝 Common Use Cases

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
