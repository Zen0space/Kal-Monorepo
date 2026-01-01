// GLM 4.6 client configuration for Zhipu AI
client<llm> GLM46 {
  provider openai-generic
  options {
    base_url env.GLM_API_BASE_URL
    api_key env.GLM_API_KEY
    model "glm-4.6"
    default_role "user"
    headers {
      "Content-Type" "application/json"
    }
  }
}

// Fallback client for resilience
client<llm> GLM46WithFallback {
  provider fallback
  options {
    strategy [GLM46]
  }
}
