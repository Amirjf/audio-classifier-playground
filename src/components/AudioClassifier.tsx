export const baseUrl = 'https://aed.zal.digital';

import { useState, useEffect } from 'react';
import { Upload, Activity, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ModelMetrics from './ModelMetrics'; // Import the ModelMetrics component we created earlier

interface TrainingConfig {
  feature_selection: {
    mfcc: boolean;
    delta_mfcc: boolean;
    hist: boolean;
    spectral_centroid: boolean;
    spectral_contrast: boolean;
    pitch_features: boolean;
    zcr: boolean;
    envelope: boolean;
    hnr: boolean;
  };
  model_name: string;
  model_type: 'svm' | 'random_forest' | 'knn'; // Add this line
  normalize: boolean;
  apply_pca: boolean;
  n_pca_components: number;
  // Model specific parameters
  C: number; // for SVM
  gamma: number; // for SVM
  n_estimators?: number; // for Random Forest
  max_depth?: number; // for Random Forest
  n_neighbors?: number; // for KNN
}

export const CATEGORY_MAPPER = {
  0: 'dog',
  36: 'vacuum_cleaner',
  19: 'thunderstorm',
  17: 'pouring_water',
  37: 'clock_alarm',
  40: 'helicopter',
  28: 'snoring',
  21: 'sneezing',
  1: 'rooster',
  42: 'siren',
};

const AudioClassifier = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [config, setConfig] = useState<TrainingConfig>({
    feature_selection: {
      mfcc: true,
      delta_mfcc: true,
      hist: true,
      spectral_centroid: true,
      spectral_contrast: true,
      pitch_features: true,
      zcr: true,
      envelope: true,
      hnr: true,
    },
    model_name: 'default_model',
    model_type: 'svm', // Add this line
    normalize: true,
    apply_pca: false,
    n_pca_components: 0.9,
    C: 1.0,
    gamma: 0.01,
    n_estimators: 100,
    max_depth: 10,
    n_neighbors: 3,
  });

  const fetchMetrics = async (modelName: string) => {
    try {
      const response = await fetch(`${baseUrl}/model_metrics/${modelName}`);
      if (!response.ok) {
        if (response.status === 404) {
          setMetrics(null);
          return;
        }
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch model metrics');
      setMetrics(null);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${baseUrl}/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const models = await response.json();
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
        await fetchMetrics(models[0]);
      }
    } catch (err) {
      setError('Failed to fetch available models');
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleModelChange = async (modelName: string) => {
    setSelectedModel(modelName);
    await fetchMetrics(modelName);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.includes('audio')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid audio file');
    }
  };

  const handleTraining = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Training failed');

      const result = await response.json();
      alert(result.message);
      setMetrics(result.metrics);
      await fetchModels();
    } catch (err) {
      setError('Failed to train model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrediction = async () => {
    if (!file || !selectedModel) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${baseUrl}/predict?model_name=${selectedModel}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Prediction failed');

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError('Failed to get prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-6 h-6" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input
                value={config.model_name}
                onChange={(e) =>
                  setConfig({ ...config, model_name: e.target.value })
                }
              />
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="features">
                <AccordionTrigger>Feature Selection</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(config.feature_selection).map(
                      ([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setConfig({
                                ...config,
                                feature_selection: {
                                  ...config.feature_selection,
                                  [key]: checked,
                                },
                              })
                            }
                          />
                          <Label>{key.replace('_', ' ').toUpperCase()}</Label>
                        </div>
                      )
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="model">
                <AccordionTrigger>Model Parameters</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.normalize}
                          onCheckedChange={(checked) =>
                            setConfig({ ...config, normalize: checked })
                          }
                        />
                        <Label>Normalize Features</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.apply_pca}
                          onCheckedChange={(checked) =>
                            setConfig({ ...config, apply_pca: checked })
                          }
                        />
                        <Label>Apply PCA</Label>
                      </div>
                    </div>

                    {config.apply_pca && (
                      <div className="space-y-2">
                        <Label>PCA Components (0-1)</Label>
                        <Slider
                          value={[config.n_pca_components]}
                          min={0.1}
                          max={1}
                          step={0.1}
                          onValueChange={([value]) =>
                            setConfig({ ...config, n_pca_components: value })
                          }
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <br />
            <div className="space-y-2">
              <Label>Model Type</Label>
              <Select
                value={config.model_type}
                onValueChange={(value: 'svm' | 'random_forest' | 'knn') =>
                  setConfig({ ...config, model_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svm">
                    Support Vector Machine (SVM)
                  </SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="knn">K-Nearest Neighbors (KNN)</SelectItem>
                </SelectContent>
              </Select>
              <br />
            </div>
            <div className="space-y-2">
              {config.model_type === 'svm' && (
                <>
                  <div className="space-y-2">
                    <Label>C (SVM Parameter)</Label>
                    <Slider
                      value={[config.C]}
                      min={0.1}
                      max={10}
                      step={0.1}
                      onValueChange={([value]) =>
                        setConfig({ ...config, C: value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gamma (SVM Parameter)</Label>
                    <Slider
                      value={[config.gamma]}
                      min={0.001}
                      max={0.1}
                      step={0.001}
                      onValueChange={([value]) =>
                        setConfig({ ...config, gamma: value })
                      }
                    />
                  </div>
                </>
              )}

              {config.model_type === 'random_forest' && (
                <>
                  <div className="space-y-2">
                    <Label>Number of Estimators</Label>
                    <Slider
                      value={[config.n_estimators || 100]}
                      min={10}
                      max={500}
                      step={10}
                      onValueChange={([value]) =>
                        setConfig({ ...config, n_estimators: value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Depth</Label>
                    <Slider
                      value={[config.max_depth || 10]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={([value]) =>
                        setConfig({ ...config, max_depth: value })
                      }
                    />
                  </div>
                </>
              )}

              {config.model_type === 'knn' && (
                <div className="space-y-2">
                  <Label>Number of Neighbors</Label>
                  <Slider
                    value={[config.n_neighbors || 3]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={([value]) =>
                      setConfig({ ...config, n_neighbors: value })
                    }
                  />
                </div>
              )}
              <div className="pt-4">
                <button
                  onClick={handleTraining}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Activity className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Train Model'
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Model</Label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      WAV, MP3 (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {file && (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">{file.name}</span>
                  <button
                    onClick={handlePrediction}
                    disabled={isLoading || !selectedModel}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {prediction && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">
                    Predicted Class: {prediction.predicted_class}
                  </h3>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelMetrics metrics={metrics} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AudioClassifier;
