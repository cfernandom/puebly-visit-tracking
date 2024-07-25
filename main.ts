import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import { Hono } from 'hono'
import { serveStatic } from 'hono/deno'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'

interface Visit {
  hmac: string,
  uuid: string,
  post_id: string,
  conversion_type: string
}

const kv = await Deno.openKv();
const app = new Hono()
const env = await load()

app.use('*', cors())

app.get('/', serveStatic({ path: './index.html'}))

app.post('/visits', async (c) => {

  try {
    const { hmac, uuid, post_id, conversion_type } = await c.req.json<Visit>()
  
    // TODO: check hmac
    
    await kv
      .atomic()
      .sum(['posts', post_id, conversion_type], 1n)
      .sum(['visits'], 1n)
      .sum(['user-visits', uuid, post_id, conversion_type], 1n)
      .commit()
    
    return c.json({ message: 'ok' })
    
  } catch (error) {
    return c.json({ error: error.message }, 400)
  }
})

app.get('/visits', (c) => {
  return streamSSE(c, async (stream) => {
    const watcher = kv.watch([['visits']])

    for await (const [entry] of watcher) {
      const visits = entry.value

      if (visits != null) {
        await stream.writeSSE({
          data: JSON.stringify({ visits: visits.toString() }), 
          event: 'visits-changed',
        })
      }
    }
  })
})

Deno.serve(app.fetch)
