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
          message: "O número NÃO é par!",
        }),
      };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "O número é par!",
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
