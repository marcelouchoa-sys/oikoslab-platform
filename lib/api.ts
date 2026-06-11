// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function post(path: string, body: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  islmbp: {
    equilibrio: (params: object)  => post('/islmbp/equilibrio', params),
    curvas:     (params: object)  => post('/islmbp/curvas',     params),
  },
  funcoes: {
    consumo:     (params: object) => post('/funcoes/consumo',     params),
    investimento:(params: object) => post('/funcoes/investimento',params),
  },
  modelo: {
    resolver: (params: object)    => post('/modelo/resolver',  params),
    validar:  (params: object)    => post('/modelo/validar',   params),
  },
}