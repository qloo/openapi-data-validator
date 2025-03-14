# State of preprocessing as of 2025-03-10:
## we don't need it right now
simply because the OpenAPI schema we get already has its $refs substituted in, and we don't have any custom formats, readonly properties, and path-level params that need to be merged with operation parameters (explained below)

## TODO: implement it anyway
We might want to have these capabilities in the future.
Need to understand serialization/deserialization for custom formats, readOnly properties, etc.

# Claude response on SchemaPreprocessor necessity
Let me help explain this with two examples to illustrate when the SchemaPreprocessor would be useful versus when it's not needed.

Example 1 - Needs Preprocessing:
```yaml
openapi: 3.0.0
info:
  title: User API with Complex Types
  version: 1.0.0
components:
  schemas:
    Timestamp:
      type: string
      format: date-time  # This would need serDes handling
    User:
      type: object
      properties:
        id:
          type: string
          readOnly: true  # This needs preprocessing to handle readOnly
        createdAt:
          $ref: '#/components/schemas/Timestamp'  # This needs ref resolution
        name:
          type: string
        email:
          type: string
paths:
  /users:
    post:
      parameters:  # These get merged with operation parameters
        - name: tenant-id
          in: header
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
```

This spec needs preprocessing because it has:
1. Custom format (date-time) that might need serialization/deserialization
2. readOnly properties that need special handling
3. Schema references that need resolution
4. Path-level parameters that need to be merged with operation parameters

Example 2 - Doesn't Need Preprocessing:
```yaml
openapi: 3.0.0
info:
  title: Simple Product API
  version: 1.0.0
paths:
  /products:
    get:
      summary: List products
      responses:
        '200':
          description: List of products
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                    price:
                      type: number
```

This spec doesn't need preprocessing because:
1. All schemas are directly defined (no $refs)
2. Uses only basic types (string, number)
3. No readOnly properties
4. No custom formats requiring serDes
5. No path-level parameters to merge

The key difference is that the first example has complex schema relationships and special OpenAPI features that need normalization, while the second example is straightforward with direct schema definitions and basic types.

