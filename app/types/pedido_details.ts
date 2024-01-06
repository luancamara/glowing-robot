// To parse this data:
//
//   import { Convert, DetalhesPedido } from "./file";
//
//   const detalhesPedido = Convert.toDetalhesPedido(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export type DetalhesPedido = {
  retorno: Retorno
}

export type Retorno = {
  status_processamento: string
  status: string
  pedido: Pedido
}

export type Pedido = {
  id: string
  numero: string
  numero_ecommerce: null
  data_pedido: string
  data_prevista: string
  data_faturamento: string
  data_envio: string
  data_entrega: string
  id_lista_preco: string
  descricao_lista_preco: string
  cliente: Cliente
  itens: Iten[]
  parcelas: any[]
  marcadores: Marcadore[]
  condicao_pagamento: string
  forma_pagamento: string
  meio_pagamento: null
  nome_transportador: string
  frete_por_conta: string
  valor_frete: string
  valor_desconto: number
  outras_despesas: string
  total_produtos: string
  total_pedido: string
  numero_ordem_compra: string
  deposito: string
  forma_envio: string
  situacao: string
  obs: string
  obs_interna: string
  id_vendedor: null
  codigo_rastreamento: string
  url_rastreamento: string
  id_nota_fiscal: string
  id_natureza_operacao: string
}

export type Cliente = {
  nome: string
  codigo: string
  nome_fantasia: null
  tipo_pessoa: string
  cpf_cnpj: string
  ie: string
  rg: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  fone: string
  email: string
  cep: string
}

export type Iten = {
  item: Item
}

export type Item = {
  id_produto: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: string
  valor_unitario: string
}

export type Marcadore = {
  marcador: Marcador
}

export type Marcador = {
  id: string
  descricao: string
  cor: string
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toDetalhesPedido(json: string): DetalhesPedido {
    return cast(JSON.parse(json), r('DetalhesPedido'))
  }

  public static detalhesPedidoToJson(value: DetalhesPedido): string {
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
      { json: 'pedido', js: 'pedido', typ: r('Pedido') }
    ],
    false
  ),
  Pedido: o(
    [
      { json: 'id', js: 'id', typ: '' },
      { json: 'numero', js: 'numero', typ: '' },
      { json: 'numero_ecommerce', js: 'numero_ecommerce', typ: null },
      { json: 'data_pedido', js: 'data_pedido', typ: '' },
      { json: 'data_prevista', js: 'data_prevista', typ: '' },
      { json: 'data_faturamento', js: 'data_faturamento', typ: '' },
      { json: 'data_envio', js: 'data_envio', typ: '' },
      { json: 'data_entrega', js: 'data_entrega', typ: '' },
      { json: 'id_lista_preco', js: 'id_lista_preco', typ: '' },
      { json: 'descricao_lista_preco', js: 'descricao_lista_preco', typ: '' },
      { json: 'cliente', js: 'cliente', typ: r('Cliente') },
      { json: 'itens', js: 'itens', typ: a(r('Iten')) },
      { json: 'parcelas', js: 'parcelas', typ: a('any') },
      { json: 'marcadores', js: 'marcadores', typ: a(r('Marcadore')) },
      { json: 'condicao_pagamento', js: 'condicao_pagamento', typ: '' },
      { json: 'forma_pagamento', js: 'forma_pagamento', typ: '' },
      { json: 'meio_pagamento', js: 'meio_pagamento', typ: null },
      { json: 'nome_transportador', js: 'nome_transportador', typ: '' },
      { json: 'frete_por_conta', js: 'frete_por_conta', typ: '' },
      { json: 'valor_frete', js: 'valor_frete', typ: '' },
      { json: 'valor_desconto', js: 'valor_desconto', typ: 0 },
      { json: 'outras_despesas', js: 'outras_despesas', typ: '' },
      { json: 'total_produtos', js: 'total_produtos', typ: '' },
      { json: 'total_pedido', js: 'total_pedido', typ: '' },
      { json: 'numero_ordem_compra', js: 'numero_ordem_compra', typ: '' },
      { json: 'deposito', js: 'deposito', typ: '' },
      { json: 'forma_envio', js: 'forma_envio', typ: '' },
      { json: 'situacao', js: 'situacao', typ: '' },
      { json: 'obs', js: 'obs', typ: '' },
      { json: 'obs_interna', js: 'obs_interna', typ: '' },
      { json: 'id_vendedor', js: 'id_vendedor', typ: null },
      { json: 'codigo_rastreamento', js: 'codigo_rastreamento', typ: '' },
      { json: 'url_rastreamento', js: 'url_rastreamento', typ: '' },
      { json: 'id_nota_fiscal', js: 'id_nota_fiscal', typ: '' },
      { json: 'id_natureza_operacao', js: 'id_natureza_operacao', typ: '' }
    ],
    false
  ),
  Cliente: o(
    [
      { json: 'nome', js: 'nome', typ: '' },
      { json: 'codigo', js: 'codigo', typ: '' },
      { json: 'nome_fantasia', js: 'nome_fantasia', typ: null },
      { json: 'tipo_pessoa', js: 'tipo_pessoa', typ: '' },
      { json: 'cpf_cnpj', js: 'cpf_cnpj', typ: '' },
      { json: 'ie', js: 'ie', typ: '' },
      { json: 'rg', js: 'rg', typ: '' },
      { json: 'endereco', js: 'endereco', typ: '' },
      { json: 'numero', js: 'numero', typ: '' },
      { json: 'complemento', js: 'complemento', typ: '' },
      { json: 'bairro', js: 'bairro', typ: '' },
      { json: 'cidade', js: 'cidade', typ: '' },
      { json: 'uf', js: 'uf', typ: '' },
      { json: 'fone', js: 'fone', typ: '' },
      { json: 'email', js: 'email', typ: '' },
      { json: 'cep', js: 'cep', typ: '' }
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
      { json: 'quantidade', js: 'quantidade', typ: '' },
      { json: 'valor_unitario', js: 'valor_unitario', typ: '' }
    ],
    false
  ),
  Marcadore: o([{ json: 'marcador', js: 'marcador', typ: r('Marcador') }], false),
  Marcador: o(
    [
      { json: 'id', js: 'id', typ: '' },
      { json: 'descricao', js: 'descricao', typ: '' },
      { json: 'cor', js: 'cor', typ: '' }
    ],
    false
  )
}
