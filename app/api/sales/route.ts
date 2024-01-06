import { NextResponse } from 'next/server'
import { Pedido, TipoPedido } from '@/app/types/pedido'
import axios from 'axios'
import { getObservedItensInNFe, updatePersonalizedItems } from '@/app/tiny/tiny'

export async function POST(request: Request) {
  if (!request.body) {
    return NextResponse.json({ error: 'no body' }, { status: 400 })
  }

  const pedido = (await request.json()) as Pedido

  if (pedido.tipo !== TipoPedido.atualizacao_pedido) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  }

  if (!pedido.dados.idNotaFiscal) {
    return NextResponse.json({ error: 'invalid order' }, { status: 400 })
  }

  await axios.get('http://localhost:3000/api/update_stock')

  const nf = pedido.dados.idNotaFiscal

  const items = await getObservedItensInNFe(nf)

  if (!!items.length) {
    console.log('Updating personalized items')
    await updatePersonalizedItems(items)
  }

  return NextResponse.json({ test: 'Success' }, { status: 200 })
}

async function getPedido(nf: string) {
  const response = await axios.get('https://api.tiny.com.br/api2/nota.fiscal.obter.php', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      id: nf
    }
  })
}
