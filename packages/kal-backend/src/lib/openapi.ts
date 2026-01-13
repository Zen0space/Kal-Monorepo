export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Kal - Malaysian Food API",
    description: "Public REST API for accessing Malaysian food nutritional data. Search our database of 100+ Malaysian foods with accurate calorie, protein, carb, and fat information.",
    version: "1.0.0",
    contact: {
      name: "Kal API Support",
      url: "https://github.com/Zen0space/Kal-Monorepo",
    },
  },
  servers: [
    { url: "/api", description: "API Base Path" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API Key required for access. Must start with 'kal_'.",
      },
    },
    schemas: {
      Food: {
        type: "object",
        properties: {
          id: { type: "string", description: "MongoDB ObjectId" },
          name: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          serving: { type: "string" },
          category: { type: "string" },
        },
      },
      HalalFood: {
        allOf: [
          { $ref: "#/components/schemas/Food" },
          {
            type: "object",
            properties: {
              brand: { type: "string" },
              halalCertifier: { type: "string" },
              halalCertYear: { type: "string" },
            },
          },
        ],
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          limit: { type: "integer" },
          offset: { type: "integer" },
          hasMore: { type: "boolean" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
    },
  },
  security: [
    { ApiKeyAuth: [] },
  ],
  paths: {
    "/foods/search": {
      get: {
        summary: "Search natural foods",
        description: "Search natural foods by name. Returns up to 20 results.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
        ],
        responses: {
          200: {
            description: "Successful search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Food" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Missing query parameter", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/foods": {
      get: {
        summary: "List natural foods",
        description: "Get all natural foods with optional filtering and pagination.",
        parameters: [
          { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Filter by category" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 }, description: "Max results" },
          { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 }, description: "Pagination offset" },
        ],
        responses: {
          200: {
            description: "Paginated list of foods",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Food" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/foods/{id}": {
      get: {
        summary: "Get natural food by ID",
        description: "Get a single natural food item by its MongoDB ObjectId.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Food ID" },
        ],
        responses: {
          200: {
            description: "Food details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Food" },
                  },
                },
              },
            },
          },
          404: { description: "Food not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/categories": {
      get: {
        summary: "List natural food categories",
        responses: {
          200: {
            description: "List of category names",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/halal/search": {
      get: {
        summary: "Search halal foods",
        description: "Search halal foods by name. Returns up to 20 results.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
        ],
        responses: {
          200: {
            description: "Successful search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/HalalFood" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Missing query parameter", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/halal": {
      get: {
        summary: "List halal foods",
        description: "Get all halal foods with optional filtering and pagination.",
        parameters: [
          { name: "brand", in: "query", required: false, schema: { type: "string" }, description: "Filter by brand" },
          { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Filter by category" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 }, description: "Max results" },
          { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 }, description: "Pagination offset" },
        ],
        responses: {
          200: {
            description: "Paginated list of halal foods",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/HalalFood" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/halal/brands": {
      get: {
        summary: "List halal brands",
        description: "Get all halal food brands.",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, description: "Search/Filter brands" },
          { name: "withCount", in: "query", required: false, schema: { type: "string", enum: ["true", "false"] }, description: "Include product count per brand" },
        ],
        responses: {
          200: {
            description: "List of brands",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      oneOf: [
                        { type: "array", items: { type: "string" } },
                        {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              productCount: { type: "integer" },
                            },
                          },
                        },
                      ],
                    },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/halal/{id}": {
      get: {
        summary: "Get halal food by ID",
        description: "Get a single halal food item by its MongoDB ObjectId.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Food ID" },
        ],
        responses: {
          200: {
            description: "Halal food details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/HalalFood" },
                  },
                },
              },
            },
          },
          404: { description: "Food not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/stats": {
      get: {
        summary: "Database statistics",
        description: "Get total food count and category/brand overview.",
        responses: {
          200: {
            description: "Database statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        naturalFoods: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            categories: { type: "array", items: { type: "string" } },
                          },
                        },
                        halalFoods: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            brands: { type: "array", items: { type: "string" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
