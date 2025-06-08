<template>
  <div class="builder-page">
    <section class="form-pane">
      <div class="top-bar">
        <div class="score-text">你的简历得分</div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="pct-text">{{ progressPct }}%</div>
      </div>

      <div class="card section-card">
        <h2>个人信息</h2>
        <p class="sub">添加电话和邮箱的用户获得了 64% 更多招聘者的积极反馈。</p>
        <label>
          <span>职位名称</span>
          <input v-model="personal.jobTitle" placeholder="软件开发工程师" />
        </label>
        <div class="two-col">
          <label>
            <span>名</span>
            <input v-model="personal.firstName" placeholder="凯文" />
          </label>
          <label>
            <span>姓</span>
            <input v-model="personal.lastName" placeholder="拓" />
          </label>
        </div>
        <div class="two-col">
          <label>
            <span>邮箱</span>
            <input v-model="personal.email" placeholder="example@邮箱.com" />
          </label>
          <label>
            <span>电话</span>
            <input v-model="personal.phone" placeholder="+86 138 0013 8000" />
          </label>
        </div>

        <button class="more-btn" @click="showMore = !showMore">
          {{ showMore ? "隐藏详情" : "添加更多详情" }}
          <span :class="showMore ? 'arrow up' : 'arrow down'"></span>
        </button>

        <transition name="fade">
          <div v-if="showMore" class="optional">
            <label>
              <span>地址</span>
              <input v-model="personal.address" placeholder="地址" />
            </label>
            <div class="two-col">
              <label>
                <span>城市 / 省份</span>
                <input v-model="personal.city" placeholder="上海" />
              </label>
              <label>
                <span>国家</span>
                <input v-model="personal.country" placeholder="中国" />
              </label>
            </div>
          </div>
        </transition>
      </div>

      <div class="card section-card">
        <h2>工作经历</h2>
        <p class="sub">展示你最近十年的相关工作经验。尽可能使用要点和数字。</p>

        <div v-for="(job, i) in jobs" :key="i" class="job-block">
          <header class="job-head">
            <span class="title">{{ job.jobTitle || "(未填写)" }}</span>
            <button class="del" @click="removeJob(i)" v-if="jobs.length > 1">
              🗑
            </button>
          </header>

          <div class="two-col">
            <label>
              <span>职位名称</span>
              <input v-model="job.jobTitle" />
            </label>
            <label>
              <span>公司</span>
              <input v-model="job.employer" />
            </label>
          </div>
          <div class="two-col">
            <label>
              <span>开始</span>
              <input type="month" v-model="job.start" />
            </label>
            <label>
              <span>结束</span>
              <input type="month" v-model="job.end" />
            </label>
          </div>
          <label>
            <span>城市</span>
            <input v-model="job.city" />
          </label>
          <label>
            <span>描述</span>
            <textarea
              v-model="job.desc"
              placeholder="描述你的成就…（每行一条要点）"
            ></textarea>
          </label>
        </div>

        <button class="add-btn" @click="addJob">＋ 添加另一个职位</button>
      </div>
    </section>

    <aside class="preview-pane">
      <div class="preview-actions">
        <button class="preview-btn" @click="goToHome">返回主页</button>
        <button class="preview-btn">更换模板</button>
      </div>
      <div class="resume">
        <section class="resume-header">
          <h1>{{ personal.firstName }} {{ personal.lastName }}</h1>
          <h3 v-if="personal.jobTitle">{{ personal.jobTitle }}</h3>
          <p class="contacts">
            <span v-if="personal.email">{{ personal.email }}</span>
            <span v-if="personal.phone">&nbsp;·&nbsp;{{ personal.phone }}</span>
          </p>
        </section>

        <section v-if="jobs.length" class="resume-employment">
          <h2>工作经历</h2>
          <div v-for="(job, i) in jobs" :key="i" class="resume-job">
            <div class="job-line">
              <span class="job-title">{{ job.jobTitle }}</span>
              <span v-if="job.employer">&nbsp;|&nbsp;{{ job.employer }}</span>
            </div>
            <div class="meta">
              <span
                >{{ formatMonth(job.start) }} – {{ formatMonth(job.end) }}</span
              >
              <span v-if="job.city">&nbsp;·&nbsp;{{ job.city }}</span>
            </div>
            <ul class="bullets">
              <li v-for="b in parseDesc(job.desc)" :key="b">{{ b }}</li>
            </ul>
          </div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

/* 个人信息 */
const personal = reactive({
  jobTitle: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
});
const showMore = ref(false);

/* 工作经历 */
const jobs = reactive([
  { jobTitle: "", employer: "", start: "", end: "", city: "", desc: "" },
]);
function addJob() {
  jobs.push({
    jobTitle: "",
    employer: "",
    start: "",
    end: "",
    city: "",
    desc: "",
  });
}
function removeJob(i) {
  jobs.splice(i, 1);
}

/* 进度 计算 */
const personalFields = ["jobTitle", "firstName", "lastName", "email", "phone"];
const employmentFields = (refs) =>
  refs.jobTitle || refs.employer || refs.start || refs.desc;
const progressPct = computed(() => {
  let filled = personalFields.filter((f) => personal[f]).length;
  filled += jobs.reduce((sum, j) => sum + (employmentFields(j) ? 1 : 0), 0);
  const total = personalFields.length + jobs.length;
  return Math.round((filled / total) * 100);
});

/* 工具 函数 */
function goToHome() {
  router.push("/resumes");
}
function formatMonth(val) {
  if (!val) return "–";
  const [y, m] = val.split("-");
  return `${m}/${y}`;
}
function parseDesc(txt) {
  return txt.split("\n").filter((l) => l.trim());
}
function onUploadPhoto(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => (personal.photo = r.result);
  r.readAsDataURL(f);
}
</script>

<style scoped src="../assets/resume.css"></style>

<style scoped>
.preview-actions {
  display: flex;
  justify-content: flex-end; /* Aligns buttons to the right */
  gap: 12px; /* Adds space between buttons */
  margin-bottom: 16px; /* Adds space below the buttons */
}

/* [MODIFIED] Created a shared class for consistent button styling */
.preview-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f0f0f0;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap; /* Prevents text from wrapping */
}
.preview-btn:hover {
  background-color: #e5e5e5;
}
</style>