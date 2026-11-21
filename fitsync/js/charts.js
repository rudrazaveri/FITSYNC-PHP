/**
 * FitSync — Comprehensive Charts Module (Chart.js)
 * Implements visualizations across Dashboard, Progress Tracking, Water Station & Analytics
 */

let weeklyActivityChartInstance = null;
let recentProgressChartInstance = null;
let fullProgressChartInstance = null;
let waterWeeklyChartInstance = null;
let analyticsChartInstance = null;

function initWeeklyActivityChart() {
  const ctx = document.getElementById('weeklyActivityChart');
  if (!ctx || !window.Chart) return;

  const data = window.fitSyncStore.state.weeklyActivity;
  if (weeklyActivityChartInstance) weeklyActivityChartInstance.destroy();

  weeklyActivityChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Workouts',
          data: data.workouts,
          backgroundColor: '#155DFC',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.65
        },
        {
          label: 'Activity Score',
          data: data.activityScore,
          backgroundColor: '#93C5FD',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.65
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
            color: '#64748B'
          }
        },
        tooltip: {
          backgroundColor: '#0F172A',
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748B' }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#F1F5F9' },
          ticks: { stepSize: 25, font: { family: "'Inter', sans-serif", size: 11 }, color: '#94A3B8' }
        }
      }
    }
  });
}

function initRecentProgressChart() {
  const ctx = document.getElementById('recentProgressChart');
  if (!ctx || !window.Chart) return;

  const data = window.fitSyncStore.state.progressData;
  if (recentProgressChartInstance) recentProgressChartInstance.destroy();

  const chartContext = ctx.getContext('2d');
  const gradient = chartContext.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, 'rgba(21, 93, 252, 0.18)');
  gradient.addColorStop(1, 'rgba(21, 93, 252, 0.01)');

  recentProgressChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data: data.weights,
          borderColor: '#155DFC',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#155DFC',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} kg`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748B' }
        },
        y: {
          min: 60,
          max: 67,
          grid: { color: '#F1F5F9' },
          ticks: {
            stepSize: 2,
            font: { family: "'Inter', sans-serif", size: 11 },
            color: '#94A3B8',
            callback: (v) => v + ' kg'
          }
        }
      }
    }
  });
}

function initFullProgressChart() {
  const ctx = document.getElementById('fullProgressChart');
  if (!ctx || !window.Chart) return;

  const data = window.fitSyncStore.state.progressData;
  if (fullProgressChartInstance) fullProgressChartInstance.destroy();

  const chartContext = ctx.getContext('2d');
  const gradient = chartContext.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(21, 93, 252, 0.22)');
  gradient.addColorStop(1, 'rgba(21, 93, 252, 0.01)');

  fullProgressChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Body Weight (kg)',
          data: data.weights,
          borderColor: '#155DFC',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#155DFC',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end' },
        tooltip: {
          backgroundColor: '#0F172A',
          callbacks: { label: (c) => ` Weight: ${c.parsed.y} kg` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11 } } },
        y: {
          min: 60,
          max: 67,
          grid: { color: '#F1F5F9' },
          ticks: { stepSize: 1, callback: (v) => v + ' kg', color: '#94A3B8' }
        }
      }
    }
  });
}

function initWaterWeeklyChart() {
  const ctx = document.getElementById('waterWeeklyChart');
  if (!ctx || !window.Chart) return;

  const logs = window.fitSyncStore.state.waterStation.weeklyHistory;
  if (waterWeeklyChartInstance) waterWeeklyChartInstance.destroy();

  waterWeeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
      datasets: [
        {
          label: 'Water Intake (L)',
          data: logs,
          backgroundColor: logs.map(val => val >= 3.0 ? '#155DFC' : '#60A5FA'),
          borderRadius: 6,
          barPercentage: 0.55
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (c) => ` ${c.parsed.y} Liters` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11 } } },
        y: {
          beginAtZero: true,
          max: 4.0,
          grid: { color: '#F1F5F9' },
          ticks: { stepSize: 1, callback: (v) => v + ' L', color: '#94A3B8' }
        }
      }
    }
  });
}

function initAnalyticsChart() {
  const ctx = document.getElementById('analyticsMonthlyChart');
  if (!ctx || !window.Chart) return;

  if (analyticsChartInstance) analyticsChartInstance.destroy();

  analyticsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Workout Adherence (%)',
          data: [88, 92, 95, 91],
          borderColor: '#155DFC',
          backgroundColor: 'rgba(21, 93, 252, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Nutrition Target Hit (%)',
          data: [82, 85, 90, 88],
          borderColor: '#16A34A',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { min: 70, max: 100, ticks: { callback: (v) => v + '%' } }
      }
    }
  });
}

window.renderAllCharts = function () {
  initWeeklyActivityChart();
  initRecentProgressChart();
  initFullProgressChart();
  initWaterWeeklyChart();
  initAnalyticsChart();
};
