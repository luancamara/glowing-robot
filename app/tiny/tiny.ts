import { axiosInstance } from '@/app/utils/utils'
import { DetalhesNF, Item } from '@/app/types/detalhes_nf'
import { observed_items } from '@/app/utils/observed_items'
import { PesquisaProdutos } from '@/app/types/pesquisa_produtos'
import {
  doc,
  FirestoreDataConverter,
  getDoc,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue
} from '@firebase/firestore'
import { firestore } from '@/app/firebase/firebase'

type StockItem = {
  id: string
  codigo: string
  nome: string
  saldo: number
  updatedAt: Date
}

type Stock = Record<string, StockItem>

const converter: FirestoreDataConverter<Stock> = {
  toFirestore: (session: WithFieldValue<Stock>) => session,
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) =>
    snapshot.data(options) as Stock
}

export async function obterNotaFiscal(nf: string) {
  const response = await axiosInstance.get<DetalhesNF>('/nota.fiscal.obter.php', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      id: nf
    }
  })

  return response.data
}

export async function getObservedItensInNFe(nf: string) {
  const response = await obterNotaFiscal(nf)

  const items: Item[] = []

  response.retorno.nota_fiscal.itens.forEach(i => {
    if (observed_items.includes(i.item.codigo.substring(0, 5))) items.push(i.item)
  })

  return items
}

export async function willUseRetail(item: Item) {
  const full_size = 200
  const selledSize = Number(item.codigo.substring(6))

  const prefix_code = item.codigo.substring(0, 5)

  console.log('Getting stock for ', prefix_code)

  const stock = await getDoc(doc(firestore, `produtos/${prefix_code}`).withConverter(converter))

  const stockData = stock.data()

  console.log(stockData)

  if (!stockData) return null

  for (let i = selledSize; i < full_size; i++) {
    const new_item_code = `${prefix_code}-${i}`

    const item = stockData[new_item_code]

    if (item && item.saldo > 0) return item
  }

  return null
}

export async function getItemAfterCut(item: Item, retail: number = 0) {
  const fullSize = retail || 200
  const selledSize = Number(item.codigo.substring(6))
  const retailSize = fullSize - selledSize

  const prefix_code = item.codigo.substring(0, 5)

  const item1 = `${prefix_code}-${selledSize}`

  const item2 = `${prefix_code}-${retailSize}`

  if (retailSize < 50) return [item1]

  return [item1, item2]
}

export async function getIdByCode(code: string) {
  const response = await axiosInstance.get<PesquisaProdutos>('/produtos.pesquisa.php', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      pesquisa: code
    }
  })

  console.log('The id of code ', code, ' is ', response.data.retorno.produtos[0].produto.id)

  return response.data.retorno.produtos[0].produto.id
}

export async function updateStockAfterCut(usedID: string, addedID: string) {
  await axiosInstance.get('/produto.atualizar.estoque.php', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      estoque: {
        idProduto: usedID,
        tipo: 'E',
        quantidade: 1
      }
    }
  })

  await axiosInstance.get('/produto.atualizar.estoque.php', {
    params: {
      token: process.env.TINY_TOKEN,
      formato: 'json',
      estoque: {
        idProduto: addedID,
        tipo: 'S',
        quantidade: 1
      }
    }
  })
}

export async function updatePersonalizedItems(items: Item[]) {
  const generatedItems = items.flatMap(async item => {
    const retail = await willUseRetail(item)

    if (retail) {
      console.log('Using retail')
      const retailSize = Number(retail.codigo.substring(6))
      return await getItemAfterCut(item, retailSize)
    } else {
      console.log('Using full size')
      await axiosInstance.get('/produto.atualizar.estoque.php', {
        params: {
          token: process.env.TINY_TOKEN,
          formato: 'json',
          estoque: {
            idProduto: await getIdByCode(item.codigo.substring(0, 5)),
            tipo: 'S',
            quantidade: 1
          }
        }
      })

      return await getItemAfterCut(item)
    }
  })

  const itemsToBeAdded = await Promise.all(generatedItems)

  const itemsToBeAddedFlat = itemsToBeAdded.flat()

  const i: Record<string, number> = {}

  itemsToBeAddedFlat.forEach(item => {
    i[item] = i[item] ? i[item] + 1 : 1
  })

  console.log('Items and quantity to add', i)

  Object.entries(i).map(async item => {
    const idProduto = await getIdByCode(item[0])

    const estoque: Record<string, any> = {}

    estoque['estoque'] = {
      idProduto: Number(idProduto),
      tipo: 'E',
      quantidade: item[1]
    }

    const p = new URLSearchParams(estoque)

    const r = await axiosInstance.post(
      '/produto.atualizar.estoque',
      {},
      {
        params: {
          token: process.env.TINY_TOKEN,
          formato: 'json',
          estoque: JSON.stringify(estoque)
        }
      }
    )

    console.log(JSON.stringify(r.data))
  })
}
