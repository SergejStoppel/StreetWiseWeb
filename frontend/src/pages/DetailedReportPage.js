
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analysisAPI } from '../services/api';

const DetailedReportPage = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await analysisAPI.getById(id);
        setAnalysis(response.data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!analysis) {
    return <div>Analysis not found</div>;
  }

  return (
    <div>
      <h1>Detailed Report</h1>
      <p>Analysis ID: {analysis.id}</p>
      <p>Status: {analysis.status}</p>
      {/* TODO: Display issues */}
    </div>
  );
};

export default DetailedReportPage;
