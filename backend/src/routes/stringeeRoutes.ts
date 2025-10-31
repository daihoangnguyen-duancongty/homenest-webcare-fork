import express, { Request, Response } from "express";
import { createStringeeToken } from "../utils/stringeeToken";

const router = express.Router();

router.get("/token", (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
 res.status(400).json({ message: "Thiếu userId" });
     return
  }

  const token = createStringeeToken(userId);
  res.json({ token });
   return
});

export default router;
