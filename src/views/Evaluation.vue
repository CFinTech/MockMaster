<template>
  <div class="evaluation-container">
    <header class="header">
      <div class="logo">MockInterview AI</div>
      <div class="user-info">
        <span class="user-name">徐小铭</span>
        <div class="avatar">徐</div>
      </div>
    </header>

    <main class="main-content">
      <section class="card score-section">
        <h2>总体面试评价</h2>
        <div class="score-display">
          <span class="score-value">8.2</span>
          <span class="score-max">/ 10</span>
        </div>
        <h2>AI 核心改进建议</h2>
        <ul class="suggestions-list">
          <li>加强语速控制，当前语速稍快，可尝试放慢10%以增强沉稳感。</li>
          <li>提升目光交流，多与摄像头互动，会显得更加自信和有亲和力。</li>
          <li>回答逻辑连贯性良好，可尝试多使用过渡性词汇（如“首先”、“其次”、“此外”）来强化结构。</li>
        </ul>
      </section>

      <section class="card chart-section">
        <h2>综合能力雷达图</h2>
        <div class="chart-wrapper">
          <canvas id="radarChart"></canvas>
        </div>
      </section>
    </main>

    <footer class="footer">
      <router-link to="/" custom v-slot="{ navigate }">
        <button @click="navigate" class="btn btn-secondary">返回面试</button>
      </router-link>
      <button class="btn btn-secondary">下载分析报告</button>
    </footer>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'EvaluationPage',
  setup() {
    onMounted(() => {
      const ctx = document.getElementById('radarChart')?.getContext('2d');
      if (!ctx) return;

      const primaryColor = '#355DCE';
      const accentColor = '#009CF3';
      const primaryTransparent = 'rgba(53, 93, 206, 0.2)';
      const textColor = '#2C3E50';
      const gridColor = 'rgba(0, 0, 0, 0.08)';

      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['语言流利度', '表达清晰度', '情绪感染力', '逻辑性', '专业知识'],
          datasets: [{
            label: '本次得分',
            data: [8, 7.5, 9, 8.2, 7.8],
            fill: true,
            backgroundColor: primaryTransparent,
            borderColor: primaryColor,
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: accentColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              min: 0,
              max: 10,
              ticks: {
                stepSize: 2,
                color: textColor,
                font: {
                  size: 12
                },
                backdropColor: 'rgba(255, 255, 255, 0.75)',
              },
              pointLabels: {
                font: {
                  size: 14,
                  weight: '500'
                },
                color: textColor
              },
              grid: {
                color: gridColor
              },
              angleLines: {
                color: gridColor
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: textColor,
                font: {
                  size: 14,
                  weight: '500'
                }
              }
            }
          }
        }
      });
    });

    return {};
  }
};
</script>

<style scoped>
@import "../assets/evaluation.css";
</style>