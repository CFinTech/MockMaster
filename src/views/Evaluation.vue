<template>
    <div class="evaluation-container">
      <!-- 顶部导航 -->
      <header class="header">
        <div class="logo">MockInterview</div>
        <div class="user-info">
          <span class="welcome-text">欢迎, 用户</span>
          <img src="https://via.placeholder.com/40" alt="Placeholder Avatar" class="avatar" />
        </div>
      </header>
  
      <!-- 主体区域 -->
      <main class="main-content">
        <!-- 合并评分与改进建议 -->
        <section class="score-section">
          <h2>总体评分</h2>
          <div class="score-display">
            <span class="score-value">8.5</span><span class="score-max">/ 10</span>
          </div>
          <h2>改进建议</h2>
          <ul class="suggestions-list">
            <li>加强语速控制，避免过快或过慢。</li>
            <li>提升目光交流，增加亲和力。</li>
            <li>使用更多过渡性词汇，增强逻辑连贯性。</li>
          </ul>
        </section>
  
        <!-- 缩小后的雷达图卡片 -->
        <section class="chart-section">
          <canvas id="radarChart"></canvas>
        </section>
      </main>
  
      <!-- 底部操作按钮 -->
      <footer class="footer">
        <router-link to="/">
          <button class="btn">返回主页</button>
        </router-link>
        <button class="btn">下载报告</button>
      </footer>
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue';
  import Chart from 'chart.js/auto';
  
  export default {
    name: 'Evaluation',
    setup() {
      onMounted(() => {
        const ctx = document.getElementById('radarChart').getContext('2d');
        new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['流利程度', '清晰度', '感染力', '逻辑性', '专业度'],
            datasets: [{
              label: '评分',
              data: [8, 7.5, 9, 8.2, 7.8],
              fill: true,
              backgroundColor: 'rgba(59,130,246,0.2)',
              borderColor: 'rgba(59,130,246,1)',
              pointBackgroundColor: 'rgba(59,130,246,1)'
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
                ticks: { stepSize: 2 }
              }
            },
            elements: {
              line: { borderWidth: 2 }
            },
            plugins: {
              title: { display: false },
              legend: { display: false }
            }
          }
        });
      });
    }
  };
  </script>
  
  <!-- 引入外部 CSS 文件 -->
  <style scoped src="../assets/evaluation.css"></style>
  