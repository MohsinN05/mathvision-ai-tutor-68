import { Request, Response } from "express";

/**
 * Stub controller — wire to your DB of choice (Mongo or Postgres).
 * See src/database/* for adapter scaffolds.
 */
export const historyController = {
  async list(_req: Request, res: Response) {
    res.json({ items: [] });
  },
  async toggleSave(req: Request, res: Response) {
    res.json({ id: req.params.id, saved: true });
  },
  async remove(req: Request, res: Response) {
    res.json({ id: req.params.id, deleted: true });
  },
};
