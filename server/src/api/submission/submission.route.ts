import { Router } from "express";
import * as SubmissionHandler from "./submission.handler";

const router = Router();

router.post("/", SubmissionHandler.createSubmission);

export default router;
