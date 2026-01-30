export default function register(api: any) {
  api.logger.info("Promitheus plugin loaded!");
  
  // Register a simple tool example
  api.registerTool({
    name: "promitheus_status",
    description: "Check Promitheus status",
    parameters: {},
    handler: async () => {
      return { status: "ok", message: "Promitheus is running!" };
    },
  });
}
