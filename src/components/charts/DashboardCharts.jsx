import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TrendChart() {
  const data = {
    labels: ['ก.พ. 69', 'มี.ค. 69', 'เม.ย. 69', 'พ.ค. 69', 'มิ.ย. 69', 'ก.ค. 69'],
    datasets: [
      {
        label: 'จำนวนคดีที่แจ้ง (คดี)',
        data: [1420, 1680, 1950, 2180, 2450, 2778],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#1E3A8A',
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Kanit' },
        bodyFont: { family: 'Kanit' }
      }
    },
    scales: {
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { font: { family: 'Kanit', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Kanit', size: 11 } }
      }
    }
  };

  return <Line data={data} options={options} height={200} />;
}

export function CategoryChart({ cases = [] }) {
  const callCenterCount = cases.filter(c => c.caseType === 'call_center').length || 4;
  const investmentCount = cases.filter(c => c.caseType === 'investment').length || 4;
  const shoppingCount = cases.filter(c => c.caseType === 'online_shopping').length || 4;

  const data = {
    labels: ['Call Center Scam', 'Investment Scam', 'Shopping Scam'],
    datasets: [
      {
        data: [callCenterCount, investmentCount, shoppingCount],
        backgroundColor: ['#2563EB', '#F59E0B', '#16A34A'],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Kanit', size: 11 }, boxWidth: 12 }
      }
    },
    cutout: '68%'
  };

  return <Doughnut data={data} options={options} height={180} />;
}

export function StatusBarChart({ cases = [] }) {
  const pending = cases.filter(c => c.status === 'pending').length;
  const investigating = cases.filter(c => c.status === 'investigating').length;
  const evidenceReview = cases.filter(c => c.status === 'evidence_review').length;
  const resolved = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const data = {
    labels: ['รอรับเรื่อง', 'กำลังสืบสวน', 'ตรวจหลักฐาน', 'คลี่คลาย/ปิดคดี'],
    datasets: [
      {
        data: [pending || 3, investigating || 5, evidenceReview || 1, resolved || 3],
        backgroundColor: ['#F59E0B', '#2563EB', '#6366F1', '#16A34A'],
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { font: { family: 'Kanit', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Kanit', size: 11 } }
      }
    }
  };

  return <Bar data={data} options={options} height={180} />;
}
