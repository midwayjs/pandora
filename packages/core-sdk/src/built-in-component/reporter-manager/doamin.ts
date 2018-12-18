export interface IReporter {
  type: string;
  report (data: any): Promise<void>;
}