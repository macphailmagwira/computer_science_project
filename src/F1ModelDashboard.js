import React, { useState, useEffect } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './F1ModelDashboard.css';

const F1ModelDashboard = () => {
  const [modelData, setModelData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('finish');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModelData = async () => {
      try {
        const response = await fetch('/model_results.json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch model results');
        }
        
        const json = await response.json();
        
        // Validate basic structure
        if (
          json.prediction_results && 
          json.finish_position_metrics && 
          json.points_prediction_metrics
        ) {
          setModelData(json);
        } else {
          setError('Invalid JSON file. The file does not match the expected schema.');
        }
      } catch (error) {
        setError(`Error loading model results: ${error.message}`);
      }
    };

    loadModelData();
  }, []);

  if (error) {
    return (
      <div className="dashboard-container error-screen">
        <div className="error-card">
          <h1 className="dashboard-title">Error Loading Model Results</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!modelData) {
    return (
      <div className="dashboard-container loading-screen">
        <div className="loading-spinner"></div>
        <h1 className="dashboard-title">F1 Race Prediction Model Dashboard</h1>
        <p className="loading-message">Loading model results...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">F1 Race Prediction Model Dashboard</h1>
        <button 
          onClick={() => window.location.reload()}
          className="reload-button"
        >
          Reload Data
        </button>
      </div>
      
      <div className="dashboard-grid">
        {/* Model Performance Card */}
        <div className="dashboard-card">
          <div className="card-content">
            <h2 className="card-title">
              {selectedMetric === 'finish' ? 'Finish Position' : 'Points'} Prediction Metrics
            </h2>
            <div className="metrics-container">
              <div className="metric-buttons">
                <button 
                  onClick={() => setSelectedMetric('finish')}
                  className={`metric-button ${selectedMetric === 'finish' ? 'active' : ''}`}
                >
                  Finish Position
                </button>
                <button 
                  onClick={() => setSelectedMetric('points')}
                  className={`metric-button ${selectedMetric === 'points' ? 'active' : ''}`}
                >
                  Points Prediction
                </button>
              </div>
              <div className="metric-values">
                {selectedMetric === 'finish' ? (
                  <>
                    <p>Accuracy: {(modelData.finish_position_metrics.accuracy * 100).toFixed(2)}%</p>
                    <p>Mean Absolute Error: {modelData.finish_position_metrics.mean_absolute_error.toFixed(2)}</p>
                  </>
                ) : (
                  <>
                    <p>R² Score: {modelData.points_prediction_metrics.r2_score.toFixed(2)}</p>
                    <p>Mean Absolute Error: {modelData.points_prediction_metrics.mean_absolute_error.toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance Card */}
        <div className="dashboard-card">
          <div className="card-content">
            <h2 className="card-title">
              {selectedMetric === 'finish' ? 'Finish Position' : 'Points'} Feature Importance
            </h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  className="feature-importance-chart"
                  data={selectedMetric === 'finish' 
                    ? modelData.finish_position_feature_importance 
                    : modelData.points_prediction_feature_importance
                  }
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Bar dataKey="importance" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Prediction Comparison Card */}
        <div className="dashboard-card full-width">
          <div className="card-content">
            <h2 className="card-title">Prediction vs Actual Results</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Race ID</th>
                    <th>Actual Finish Position</th>
                    <th>Predicted Finish Position</th>
                    <th>Prediction Probability</th>
                    <th>Actual Points</th>
                    <th>Predicted Points</th>
                  </tr>
                </thead>
                <tbody>
                  {modelData.prediction_results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.race_id}</td>
                      <td>{result.actual_finish_position}</td>
                      <td>{result.predicted_finish_position}</td>
                      <td>{(result.finish_prediction_probability * 100).toFixed(2)}%</td>
                      <td>{result.actual_points}</td>
                      <td>{result.predicted_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Classification Report */}
        {selectedMetric === 'finish' && (
          <div className="dashboard-card full-width">
            <div className="card-content">
              <h2 className="card-title">Classification Report</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1-Score</th>
                      <th>Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(modelData.finish_position_metrics.classification_report)
                      .filter(([key]) => key !== 'accuracy' && key !== 'macro avg' && key !== 'weighted avg')
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value.precision.toFixed(2)}</td>
                          <td>{value.recall.toFixed(2)}</td>
                          <td>{value['f1-score'].toFixed(2)}</td>
                          <td>{value.support}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default F1ModelDashboard;