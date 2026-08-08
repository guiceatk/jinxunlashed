import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { WorkflowRunner, WorkflowGraph, StreamEventEnvelope } from '@jinxunlashed/workflow-engine';
import { BrowserController } from '@jinxunlashed/browser-engine';

const server = Fastify({ logger: true });
const browserController = new BrowserController();

await server.register(cors, { origin: true });
await server.register(websocket);

// Active WebSocket client connections for live event broadcasting
const wsClients = new Set<any>();

// Heartbeat ping interval (30s) to maintain QUIC / Cloudflare tunnel stability
setInterval(() => {
  const pingMessage = JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() });
  for (const client of wsClients) {
    if (client.readyState === 1) {
      client.send(pingMessage);
    }
  }
}, 30000);

// WebSocket Workflow & Telemetry Streaming Endpoint
server.register(async (fastify) => {
  fastify.get('/ws/workflow', { websocket: true }, (connection: any) => {
    const socket = connection.socket || connection;
    wsClients.add(socket);

    socket.on('message', async (rawMessage: any) => {
      try {
        const payload = JSON.parse(rawMessage.toString());
        if (payload.action === 'run_workflow' && payload.graph) {
          const graph: WorkflowGraph = payload.graph;

          const runner = new WorkflowRunner({
            concurrency: 2,
            maxRetries: 2,
            onEvent: (event: StreamEventEnvelope) => {
              socket.send(JSON.stringify({ type: 'workflow_event', event }));
            },
          });

          const sessionId = await browserController.createSession({
            sessionId: `sess_${Date.now()}`,
          });

          try {
            const result = await runner.execute(graph, async (node, ctx) => {
              if (node.type === 'browser') {
                const action = node.config as any;
                const actResult = await browserController.executeAction(sessionId, action);
                if (!actResult.success) throw new Error(actResult.error);
                return actResult.data;
              }

              if (node.type === 'model') {
                const prompt = (node.config.prompt as string) || 'Synthesize workflow state';
                return `[Model Output]: Analyzed request "${prompt}" with context payload.`;
              }

              return { status: 'executed', nodeId: node.id };
            });

            socket.send(JSON.stringify({ type: 'workflow_complete', result }));
          } finally {
            await browserController.closeSession(sessionId);
          }
        }
      } catch (err) {
        socket.send(
          JSON.stringify({
            type: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        );
      }
    });

    socket.on('close', () => {
      wsClients.delete(socket);
    });
  });
});

// Production-Grade Cloudflare / SSE Streaming Route
export async function setupStreamingRoutes(fastifyServer: FastifyInstance) {
  fastifyServer.get(
    '/v1/stream/runs/:runId',
    (req: FastifyRequest<{ Params: { runId: string } }>, reply: FastifyReply) => {
      const { runId } = req.params;

      // Headers to bypass Cloudflare SSE buffering and prevent QUIC degradation
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');

      // Initial connection frame
      reply.raw.write(
        `data: ${JSON.stringify({ event: 'connected', runId, timestamp: new Date().toISOString() })}\n\n`
      );

      // Periodic Heartbeat to maintain connection
      const keepAlive = setInterval(() => {
        reply.raw.write(`: heartbeat ${new Date().toISOString()}\n\n`);
      }, 15000);

      const cleanup = () => {
        clearInterval(keepAlive);
        req.raw.removeListener('close', cleanup);
        reply.raw.end();
      };

      req.raw.on('close', cleanup);
    }
  );
}

await setupStreamingRoutes(server);

// Health check endpoint
server.get('/api/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Start Server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
try {
  await server.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 JINXUNLASHED Server listening on http://localhost:${PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
