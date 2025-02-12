import { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ZAxis,
} from 'recharts';
import { baseUrl } from './AudioClassifier';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const getColor = (index: number) => {
  const colors = [
    '#FF5733',
    '#33FF57',
    '#5733FF',
    '#FFD700',
    '#FF33A8',
    '#33FFF5',
    '#A833FF',
    '#FF8C33',
  ];
  return colors[index % colors.length]; // Cycle through colors
};

const FeatureScatter = () => {
  const [data, setData] = useState<{ x: number; y: number; label: string }[]>(
    []
  );
  const [uniqueLabels, setUniqueLabels] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${baseUrl}/visualize`)
      .then((response) => response.json())
      .then((jsonData) => {
        setData(jsonData.data);
        setUniqueLabels(jsonData.labels);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="feature-scatter" className="pr-10">
        <AccordionTrigger>
          <h2 className="text-lg font-semibold text-center mb-4 px-10">
            Features Scatter Plot
          </h2>
        </AccordionTrigger>
        <AccordionContent>
          <div className="w-full h-full p-4 border border-gray-300 rounded-lg bg-white">
            <ResponsiveContainer minHeight={500} width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" hide />
                <YAxis type="number" dataKey="y" hide />
                <ZAxis range={[100, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />

                {/* Render a Scatter plot for each label with a unique color */}
                {uniqueLabels?.map((label, index) => (
                  <Scatter
                    key={label}
                    name={label}
                    data={data.filter((d) => d.label === label)}
                    fill={getColor(index)}
                  />
                ))}

                {/* Enable zoom and panning */}
                <Brush dataKey="x" height={20} stroke="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FeatureScatter;
