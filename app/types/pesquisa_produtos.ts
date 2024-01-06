export type PesquisaProdutos = {
  retorno: Retorno
}

export type Retorno = {
  status_processamento: string
  status: string
  pagina: number
  numero_paginas: number
  produtos: ProdutoElement[]
}

export type ProdutoElement = {
  produto: ProdutoProduto
}

export type ProdutoProduto = {
  id: string
  data_criacao: string
  nome: string
  codigo: string
  preco: number
  preco_promocional: number
  unidade: string
  gtin: string
  tipoVariacao: string
  localizacao: string
  preco_custo: number
  preco_custo_medio: number
  situacao: string
}