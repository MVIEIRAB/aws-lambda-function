# Introdução

Recurso em nuvem que permite que nós criemos funções, ou trechos de códigos que executam ações especificas sem ter a necessidade de ter um servidor em pé (maquina), nem ter configurado um apache, ou um serviço HTTP.

# Benefícios

É possível ter esse serviço consumido em algumas formas, as principais são:

- Executado por eventos: Eventos táis como, dentro do escopo da AWS, caso um arquivo for upado em uma bucket, essa função escutará essa sinalização e executara uma ação em cima disso, além de executar com base no evento, da pra capturar os dados que foram recebidos, pra fazermos tratamentos especificos daquele determinado objeto.
- Serviço HTTP: Temos também a opção de expor essa função como uma API, dai então será executado sempre que alguem enviar alguma chamada para a URL.

> Aqui é cobrado somente o tempo de uso. Nesse caso, o serviço ficará em “stand by”, até que alguem o chame.
> 

# Adicionais

- AWS API Gateways
- LAMBDA Function Layer

# Configuração + Caso de uso

Configuração inicial do **package.json**

```json
{
  "name": "isodd-lambda",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "tsup index.ts",
    "postbuild": "cd dist && zip -r index.zip index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "is-odd": "^3.0.1"
  },
  "devDependencies": {
    "aws-lambda": "^1.0.7",
    "aws-sdk": "^2.1562.0",
    "@types/aws-lambda": "^8.10.134",
    "@types/is-odd": "^3.0.4",
    "@types/node": "^20.11.19",
    "tsup": "^8.0.2",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}

```

Conteúdo do arquivo principal **index.ts,** o código simplesmente retorna true se o numero enviadono corpo for pár ou ímpar se for ímpar.

```jsx
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import isOdd from "is-odd";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const number = JSON.parse(event.body!).number;
    const shouldIReturnTrue = isOdd(number);

    if (shouldIReturnTrue)
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "The number is odd! :)",
        }),
      };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "The number is not odd! :(",
      }),
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "some error happened",
      }),
    };
  }
};

```

Comando usado pra registrar uma regra de execução

```bash
aws iam create-role --role-name lambda-ex --assume-role-policy-document '{"Version": "2012-10-17","Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}'
```

Comando usado pra atribuir uma politica na minha regra criada acima, para o funcionamento da função

```bash
aws iam attach-role-policy --role-name lambda-ex --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Criando a função lambda pelo CLI, já vinculando as regras e politicas acima

```bash
aws lambda create-function --function-name my-function \
--zip-file fileb://dist/index.zip --handler index.handler --runtime nodejs20.x \
--role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-ex
```

Criando um API Gateway para acessar a nossa função através do HTTP

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/135ae565-fa03-413f-807a-80e779c61907/4b17e27e-7710-487f-9939-8e4765436ca5/Untitled.png)

Obs: Sem autenticação;

## Configurando camada a parte para acesso as bibliotecas externas do Nodejs dentro da nossa função, que está sendo executada dentro da AWS

Criando os arquivos que serão enviados para a camada de execução da função

```bash
{
  "name": "isodd-layer",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "is-odd": "^3.0.1"
  }
}
```

Incluir uma nova pasta e um novo arquivo package.json, iremos instalar as deps dele dentro dessa pasta e zipalo voltando para a rais da pasta.

Nomeei a pasta de **nodejs → package.json + package-lock.json + node_modules**

Com o zip dessa pasta contendo o package json e o node_modules, executei o comando de publicação de uma camada para a função em questão

```bash
aws lambda publish-layer-version --layer-name my-layer \
 --description “My layer” \
 --license-info “MIT” \
 --zip-file fileb://nodejs.zip \
 --compatible-runtimes nodejs20.x nodejs18.x \
 --compatible-architectures “arm64” “x86_64”
```

Resposta do comando

```json
{
 “Content”: {
 “Location”: “https://awslambda-us-east-2-layers.s3.us-east-2.amazonaws.com/snapshots/123456789012/my-layer-4aaa2fbb-ff77-4b0a-ad92-5b78a716a96a?versionId=27iWyA73cCAYqyH...",
 “CodeSha256”: “tv9jJO+rPbXUUXuRKi7CwHzKtLDkDRJLB3cC3Z/ouXo=”,
 “CodeSize”: 169
 },
 “LayerArn”: “arn:aws:lambda:us-east-2:123456789012:layer:my-layer”,
 “LayerVersionArn”: “arn:aws:lambda:us-east-2:123456789012:layer:my-layer:1”,
 “Description”: “My layer”,
 “CreatedDate”: “2023–11–14T23:03:52.894+0000”,
 “Version”: 1,
 “CompatibleArchitectures”: [
 “arm64”,
 “x86_64”
 ],
 “LicenseInfo”: “MIT”,
 “CompatibleRuntimes”: [
 “nodejs20.x”,
 “nodejs18.x”
 ]
}
```

Com a informação contida no campo “LayerVersionArn”, executo o comando pra atualizar minha atual função, aplicando a camada criada acima

```json
aws lambda update-function-configuration --function-name my-function \
    --layers NOME_DA_LAYER_LayerVersionArn
```
