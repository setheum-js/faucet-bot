import Router from "koa-router";
import { Service } from "../../services";
import logger from "../../util/logger";
import { Storage } from "../../util/storage";
import { Config } from "../../util/config";

export const queryCandy = (service: Service, storage: Storage, config: Config["channel"]["api"]): Router.IMiddleware => async (ctx) => {
  const address = ctx?.request?.query?.address;
  if (!address) {
    ctx.response.body = "params error, address required.";
    return;
  }

  try {
    let candy = await storage.queryCandy(address);
    if (candy.length > 0) {
      const status = await storage.queryCandyDropped(address);
      if (status > 0) {
        candy = [];
      }
    }
    ctx.response.body = {
      code: 200,
      message: {
        address,
        candy,
      },
    };
  } catch (e) {
    ctx.response.body = {
      code: 500,
      message: (e as Error).message,
    };
  }
};

export const sendCandy = (service: Service, storage: Storage, config: Config["channel"]["api"]): Router.IMiddleware => async (ctx) => {
  const address = ctx?.request?.body?.address;
  if (!address) {
    ctx.response.body = "params error, address required.";
    return;
  }

  try {
    const status = await storage.queryCandyDropped(address);
    if (status > 0) {
      ctx.response.body = {
        code: 400,
        message: service.getErrorMessage("CANDY_CLAIMED", { address }),
      };
      return;
    }
    const candy = await storage.queryCandy(address);
    // todo: query tc2 data
    if (candy.length == 0) {
      ctx.response.body = {
        code: 400,
        message: service.getErrorMessage("CANDY_EMPTY", { address }),
      };
      return;
    }

    // todo:
    // storage.addCandyDrop()
    // res = await service.sendCandy()
    // if (res) { storage.updateCandyDrop() }

    ctx.response.body = {
      code: 200,
      mssage: "test",
    };
  } catch (e) {
    ctx.response.body = {
      code: 500,
      message: (e as Error).message,
    };
  }
};
