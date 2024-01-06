import { axiosInstance } from '@/app/utils/utils'
import { format, getTime } from 'date-fns'
import { NextResponse } from 'next/server'
import { UpdateEstoque } from '@/app/types/update-estoque'
import { doc, writeBatch } from '@firebase/firestore'
import { firestore } from '@/app/firebase/firebase'

export async function GET(request: Request) {
  const response = await axiosInstance.get<UpdateEstoque>('/lista.atualizacoes.estoque', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      dataAlteracao: format(new Date(), 'dd/MM/yyyy HH:mm:ss')
    }
  })

  console.log(response.data)

  if (response.data.retorno.status === 'Erro') {
    return NextResponse.json({ message: 'Nothing to update' }, { status: 200 })
  }

  const produtos = response.data.retorno.produtos || []

  const batch = writeBatch(firestore)

  produtos.forEach(produto => {
    const prefix = produto.produto.codigo.substring(0, 5)

    const hasChildren = produto.produto.codigo.charAt(5) === '-'

    const docRef = doc(firestore, `produtos/${prefix}`)

    batch.set(
      docRef,
      {
        updatedAt: getTime(new Date()),
        [`${produto.produto.codigo}`]: {
          id: produto.produto.id,
          codigo: produto.produto.codigo,
          nome: produto.produto.nome,
          saldo: produto.produto.saldo,
          updatedAt: getTime(new Date())
        }
      },
      { merge: true }
    )
  })

  try {
    await batch.commit()
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 })
}
