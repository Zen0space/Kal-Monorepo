// Claude Haiku 4.5 via Pika AI proxy
client<llm> Claude {
  provider anthropic
  options {
    base_url env.PIKA_BASE_URL
    api_key env.PIKA_API_KEY
    model "claude-haiku-4.5"
  }
}
