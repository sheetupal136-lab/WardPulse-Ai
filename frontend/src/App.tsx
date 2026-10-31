import React from 'react';
import { WardPulseProvider, useWardPulse } from './context/WardPulseContext';
import { Layout } from './components/layout/Layout';
import { OverviewView } from './views/OverviewView';
import { WardMapView } from './views/WardMapView';
import { PredictionsView } from './views/PredictionsView';
import { DatasetModelView } from './views/DatasetModelView';
import { ResourcePlannerView } from './views/ResourcePlannerView';

const MainView: React.FC = () => {
  const { activeTab } = useWardPulse();

  switch (activeTab) {
    case 'overview':
      return <OverviewView />;
    case 'ward-map':
      return <WardMapView />;
    case 'predictions':
      return <PredictionsView />;
    case 'dataset-model':
      return <DatasetModelView />;
    case 'resource-planner':
      return <ResourcePlannerView />;
    default:
      return <OverviewView />;
  }
};

export const App: React.FC = () => {
  return (
    <WardPulseProvider>
      <Layout>
        <MainView />
      </Layout>
    </WardPulseProvider>
  );
};

export default App;
