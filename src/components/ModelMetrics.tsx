import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_MAPPER } from './AudioClassifier';

const ModelMetrics = ({ metrics }: any) => {
  const formatNumber = (num: number) => (num * 100).toFixed(2) + '%';

  console.log(metrics);
  const renderClassificationReport = (report: any) => {
    const classes = Object.keys(report).filter(
      (key) => !['accuracy', 'macro avg', 'weighted avg'].includes(key)
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Precision</TableHead>
            <TableHead>Recall</TableHead>
            <TableHead>F1-score</TableHead>
            <TableHead>Support</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((className) => (
            <TableRow key={className}>
              {/* @ts-ignore */}
              <TableCell>{CATEGORY_MAPPER[className] || ''}</TableCell>
              <TableCell>{formatNumber(report[className].precision)}</TableCell>
              <TableCell>{formatNumber(report[className].recall)}</TableCell>
              <TableCell>
                {formatNumber(report[className]['f1-score'])}
              </TableCell>
              <TableCell>{report[className].support}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-medium">
            <TableCell>Accuracy</TableCell>
            <TableCell colSpan={3}>{formatNumber(report.accuracy)}</TableCell>
            <TableCell>{report['macro avg'].support}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  const renderModelMetrics = (modelMetrics: any) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Overall Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Test Accuracy</TableCell>
                <TableCell>
                  {formatNumber(modelMetrics.test_accuracy)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Test AUC</TableCell>
                <TableCell>{formatNumber(modelMetrics.test_auc)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Training Accuracy</TableCell>
                <TableCell>
                  {formatNumber(modelMetrics.train_accuracy)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Classification Report</CardTitle>
        </CardHeader>
        <CardContent>
          {renderClassificationReport(modelMetrics.classification_report)}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      {metrics.svm && renderModelMetrics(metrics.svm)}
      {metrics.random_forest && renderModelMetrics(metrics.random_forest)}
      {metrics.knn && renderModelMetrics(metrics.knn)}
    </div>
  );
};

export default ModelMetrics;
