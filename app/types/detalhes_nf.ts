// To parse this data:
//
//   import { Convert, DetalhesPedido } from "./file";
//
//   const detalhesPedido = Convert.toDetalhesPedido(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export type DetalhesNF = {
  retorno: RetornoDetalhesNF
}

export type RetornoDetalhesNF = {
  status_processamento: string
  status: string
  nota_fiscal: NotaFiscal
}

export type NotaFiscal = {
  id: string
  tipo_nota: string
  natureza_operacao: string
  regime_tributario: string
  finalidade: string
  serie: string
  numero: string
  numero_ecommerce: string
  data_emissao: string
  data_saida: string
  hora_saida: string
  cliente: Cliente
  endereco_entrega: Cliente
  itens: Iten[]
  base_icms: string
  valor_icms: string
  base_icms_st: string
  valor_icms_st: string
  valor_servicos: string
  valor_produtos: string
  valor_frete: string
  valor_seguro: string
  valor_outras: string
  valor_ipi: string
  valor_issqn: string
  valor_nota: string
  valor_desconto: string
  valor_faturado: string
  frete_por_conta: string
  transportador: Transportador
  placa: string
  uf_placa: string
  quantidade_volumes: string
  especie_volumes: string
  marca_volumes: string
  numero_volumes: string
  peso_bruto: string
  peso_liquido: string
  codigo_rastreamento: string
  url_rastreamento: string
  condicao_pagamento: string
  forma_pagamento: string
  meio_pagamento: null
  parcelas: ParcelaElement[]
  id_venda: string
  id_vendedor: null
  nome_vendedor: string
  situacao: string
  descricao_situacao: string
  obs: string
  marcadores: any[]
}

export type Cliente = {
  nome?: string
  tipo_pessoa: string
  cpf_cnpj: string
  ie: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  cidade: string
  uf: string
  fone: string
  email?: string
  nome_destinatario?: string
}

export type Iten = {
  item: Item
}

export type Item = {
  id_produto: string
  codigo: string
  descricao: string
  unidade: string
  ncm: string
  quantidade: string
  valor_unitario: string
  valor_total: string
  cfop: string
  natureza: string
}

export type ParcelaElement = {
  parcela: ParcelaParcela
}

export type ParcelaParcela = {
  dias: string
  data: string
  valor: string
  obs: string
  forma_pagamento: string
  meio_pagamento: null
}

export type Transportador = {
  nome: string
  cpf_cnpj: string
  ie: string
  endereco: string
  cidade: string
  uf: string
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toDetalhesPedido(json: string): DetalhesNF {
    return cast(JSON.parse(json), r('DetalhesPedido'))
  }

  public static detalhesPedidoToJson(value: DetalhesNF): string {
    return JSON.stringify(uncast(value, r('DetalhesPedido')), null, 2)
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ)
  const parentText = parent ? ` on ${parent}` : ''
  const keyText = key ? ` for key "${key}"` : ''
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`
  )
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`
    } else {
      return `one of [${typ
        .map(a => {
          return prettyTypeName(a)
        })
        .join(', ')}]`
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal
  } else {
    return typeof typ
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }))
    typ.jsonToJS = map
  }
  return typ.jsonToJS
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }))
    typ.jsToJSON = map
  }
  return typ.jsToJSON
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val
    return invalidValue(typ, val, key, parent)
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length
    for (let i = 0; i < l; i++) {
      const typ = typs[i]
      try {
        return transform(val, typ, getProps)
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent)
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val
    return invalidValue(
      cases.map(a => {
        return l(a)
      }),
      val,
      key,
      parent
    )
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l('array'), val, key, parent)
    return val.map(el => transform(el, typ, getProps))
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null
    }
    const d = new Date(val)
    if (isNaN(d.valueOf())) {
      return invalidValue(l('Date'), val, key, parent)
    }
    return d
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(l(ref || 'object'), val, key, parent)
    }
    const result: any = {}
    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key]
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined
      result[prop.key] = transform(v, prop.typ, getProps, key, ref)
    })
    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = val[key]
      }
    })
    return result
  }

  if (typ === 'any') return val
  if (typ === null) {
    if (val === null) return val
    return invalidValue(typ, val, key, parent)
  }
  if (typ === false) return invalidValue(typ, val, key, parent)
  let ref: any = undefined
  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref
    typ = typeMap[typ.ref]
  }
  if (Array.isArray(typ)) return transformEnum(typ, val)
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
        ? transformArray(typ.arrayItems, val)
        : typ.hasOwnProperty('props')
          ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent)
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(val)
  return transformPrimitive(typ, val)
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps)
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps)
}

function l(typ: any) {
  return { literal: typ }
}

function a(typ: any) {
  return { arrayItems: typ }
}

function u(...typs: any[]) {
  return { unionMembers: typs }
}

function o(props: any[], additional: any) {
  return { props, additional }
}

function m(additional: any) {
  return { props: [], additional }
}

function r(name: string) {
  return { ref: name }
}

const typeMap: any = {
  DetalhesPedido: o([{ json: 'retorno', js: 'retorno', typ: r('Retorno') }], false),
  Retorno: o(
    [
      { json: 'status_processamento', js: 'status_processamento', typ: '' },
      { json: 'status', js: 'status', typ: '' },
      { json: 'nota_fiscal', js: 'nota_fiscal', typ: r('NotaFiscal') }
    ],
    false
  ),
  NotaFiscal: o(
    [
      { json: 'id', js: 'id', typ: '' },
      { json: 'tipo_nota', js: 'tipo_nota', typ: '' },
      { json: 'natureza_operacao', js: 'natureza_operacao', typ: '' },
      { json: 'regime_tributario', js: 'regime_tributario', typ: '' },
      { json: 'finalidade', js: 'finalidade', typ: '' },
      { json: 'serie', js: 'serie', typ: '' },
      { json: 'numero', js: 'numero', typ: '' },
      { json: 'numero_ecommerce', js: 'numero_ecommerce', typ: '' },
      { json: 'data_emissao', js: 'data_emissao', typ: '' },
      { json: 'data_saida', js: 'data_saida', typ: '' },
      { json: 'hora_saida', js: 'hora_saida', typ: '' },
      { json: 'cliente', js: 'cliente', typ: r('Cliente') },
      { json: 'endereco_entrega', js: 'endereco_entrega', typ: r('Cliente') },
      { json: 'itens', js: 'itens', typ: a(r('Iten')) },
      { json: 'base_icms', js: 'base_icms', typ: '' },
      { json: 'valor_icms', js: 'valor_icms', typ: '' },
      { json: 'base_icms_st', js: 'base_icms_st', typ: '' },
      { json: 'valor_icms_st', js: 'valor_icms_st', typ: '' },
      { json: 'valor_servicos', js: 'valor_servicos', typ: '' },
      { json: 'valor_produtos', js: 'valor_produtos', typ: '' },
      { json: 'valor_frete', js: 'valor_frete', typ: '' },
      { json: 'valor_seguro', js: 'valor_seguro', typ: '' },
      { json: 'valor_outras', js: 'valor_outras', typ: '' },
      { json: 'valor_ipi', js: 'valor_ipi', typ: '' },
      { json: 'valor_issqn', js: 'valor_issqn', typ: '' },
      { json: 'valor_nota', js: 'valor_nota', typ: '' },
      { json: 'valor_desconto', js: 'valor_desconto', typ: '' },
      { json: 'valor_faturado', js: 'valor_faturado', typ: '' },
      { json: 'frete_por_conta', js: 'frete_por_conta', typ: '' },
      { json: 'transportador', js: 'transportador', typ: r('Transportador') },
      { json: 'placa', js: 'placa', typ: '' },
      { json: 'uf_placa', js: 'uf_placa', typ: '' },
      { json: 'quantidade_volumes', js: 'quantidade_volumes', typ: '' },
      { json: 'especie_volumes', js: 'especie_volumes', typ: '' },
      { json: 'marca_volumes', js: 'marca_volumes', typ: '' },
      { json: 'numero_volumes', js: 'numero_volumes', typ: '' },
      { json: 'peso_bruto', js: 'peso_bruto', typ: '' },
      { json: 'peso_liquido', js: 'peso_liquido', typ: '' },
      { json: 'codigo_rastreamento', js: 'codigo_rastreamento', typ: '' },
      { json: 'url_rastreamento', js: 'url_rastreamento', typ: '' },
      { json: 'condicao_pagamento', js: 'condicao_pagamento', typ: '' },
      { json: 'forma_pagamento', js: 'forma_pagamento', typ: '' },
      { json: 'meio_pagamento', js: 'meio_pagamento', typ: null },
      { json: 'parcelas', js: 'parcelas', typ: a(r('ParcelaElement')) },
      { json: 'id_venda', js: 'id_venda', typ: '' },
      { json: 'id_vendedor', js: 'id_vendedor', typ: null },
      { json: 'nome_vendedor', js: 'nome_vendedor', typ: '' },
      { json: 'situacao', js: 'situacao', typ: '' },
      { json: 'descricao_situacao', js: 'descricao_situacao', typ: '' },
      { json: 'obs', js: 'obs', typ: '' },
      { json: 'marcadores', js: 'marcadores', typ: a('any') }
    ],
    false
  ),
  Cliente: o(
    [
      { json: 'nome', js: 'nome', typ: u(undefined, '') },
      { json: 'tipo_pessoa', js: 'tipo_pessoa', typ: '' },
      { json: 'cpf_cnpj', js: 'cpf_cnpj', typ: '' },
      { json: 'ie', js: 'ie', typ: '' },
      { json: 'endereco', js: 'endereco', typ: '' },
      { json: 'numero', js: 'numero', typ: '' },
      { json: 'complemento', js: 'complemento', typ: '' },
      { json: 'bairro', js: 'bairro', typ: '' },
      { json: 'cep', js: 'cep', typ: '' },
      { json: 'cidade', js: 'cidade', typ: '' },
      { json: 'uf', js: 'uf', typ: '' },
      { json: 'fone', js: 'fone', typ: '' },
      { json: 'email', js: 'email', typ: u(undefined, '') },
      { json: 'nome_destinatario', js: 'nome_destinatario', typ: u(undefined, '') }
    ],
    false
  ),
  Iten: o([{ json: 'item', js: 'item', typ: r('Item') }], false),
  Item: o(
    [
      { json: 'id_produto', js: 'id_produto', typ: '' },
      { json: 'codigo', js: 'codigo', typ: '' },
      { json: 'descricao', js: 'descricao', typ: '' },
      { json: 'unidade', js: 'unidade', typ: '' },
      { json: 'ncm', js: 'ncm', typ: '' },
      { json: 'quantidade', js: 'quantidade', typ: '' },
      { json: 'valor_unitario', js: 'valor_unitario', typ: '' },
      { json: 'valor_total', js: 'valor_total', typ: '' },
      { json: 'cfop', js: 'cfop', typ: '' },
      { json: 'natureza', js: 'natureza', typ: '' }
    ],
    false
  ),
  ParcelaElement: o([{ json: 'parcela', js: 'parcela', typ: r('ParcelaParcela') }], false),
  ParcelaParcela: o(
    [
      { json: 'dias', js: 'dias', typ: '' },
      { json: 'data', js: 'data', typ: '' },
      { json: 'valor', js: 'valor', typ: '' },
      { json: 'obs', js: 'obs', typ: '' },
      { json: 'forma_pagamento', js: 'forma_pagamento', typ: '' },
      { json: 'meio_pagamento', js: 'meio_pagamento', typ: null }
    ],
    false
  ),
  Transportador: o(
    [
      { json: 'nome', js: 'nome', typ: '' },
      { json: 'cpf_cnpj', js: 'cpf_cnpj', typ: '' },
      { json: 'ie', js: 'ie', typ: '' },
      { json: 'endereco', js: 'endereco', typ: '' },
      { json: 'cidade', js: 'cidade', typ: '' },
      { json: 'uf', js: 'uf', typ: '' }
    ],
    false
  )
}
