import { Request, Response } from "express";
import { ReportService } from "../services/report.service";
import { asyncHandler } from "../utils/asyncHandler";

const reportService = new ReportService();

export const reportController = {
  getMonthlyReport: asyncHandler(async (req: Request, res: Response) => {
    const { year, month } = req.query;

    if (!year || !month) {
      res.status(400).json({
        error: "Parameter 'year' dan 'month' wajib diisi",
      });
      return;
    }

    const report = await reportService.getMonthlyReport(
      parseInt(year as string, 10),
      parseInt(month as string, 10)
    );

    res.json(report);
  }),
};
