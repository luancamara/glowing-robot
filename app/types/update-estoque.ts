export type UpdateEstoque = {
  retorno: Retorno
}

export type Retorno = {
  status_processamento: string
  status: string
  produtos?: ProdutoElement[]
  codigo_erro?: string
  erros?: Erro[]
}

export type ProdutoElement = {
  produto: ProdutoProduto
}

export type ProdutoProduto = {
  id: string
  nome: string
  codigo: string
  unidade: string
  tipo_variacao: string
  localizacao: string
  saldo: number
  saldoReservado: number
  depositos: DepositoElement[]
}

export type DepositoElement = {
  deposito: DepositoDeposito
}

export type DepositoDeposito = {
  nome: string
  desconsiderar: string
  saldo: number
}

export type Erro = {
  erro: string
}
