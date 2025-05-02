<template>
  <div class="builder-page">
    <!-- ---------- 左侧表单区 ---------- -->
    <section class="form-pane">
      <!-- 顶部进度 -->
      <div class="top-bar">
        <div class="score-text">Your resume score</div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="pct-text">{{ progressPct }}%</div>
      </div>

      <!-- Personal details 卡片 -->
      <div class="card section-card">
        <h2>Personal details</h2>
        <p class="sub">
          Users who added phone number and email received 64% more positive
          feedback from recruiters.
        </p>
        <label>
          <span>Job Title</span>
          <input v-model="personal.jobTitle" placeholder="Software Developer" />
        </label>
        <div class="two-col">
          <label>
            <span>First Name</span>
            <input v-model="personal.firstName" placeholder="Kaiwen" />
          </label>
          <label>
            <span>Last Name</span>
            <input v-model="personal.lastName" placeholder="TUO" />
          </label>
        </div>
        <div class="two-col">
          <label>
            <span>Email</span>
            <input v-model="personal.email" placeholder="me@example.com" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model="personal.phone" placeholder="+86 138 0013 8000" />
          </label>
        </div>

        <!-- 可选详情 -->
        <button class="more-btn" @click="showMore = !showMore">
          {{ showMore ? "Hide details" : "Add more details" }}
          <span :class="showMore ? 'arrow up' : 'arrow down'"></span>
        </button>

        <transition name="fade">
          <div v-if="showMore" class="optional">
            <label>
              <span>Address</span>
              <input v-model="personal.address" placeholder="Address line" />
            </label>
            <div class="two-col">
              <label>
                <span>City / State</span>
                <input v-model="personal.city" placeholder="Shanghai" />
              </label>
              <label>
                <span>Country</span>
                <input v-model="personal.country" placeholder="China" />
              </label>
            </div>
          </div>
        </transition>
      </div>

      <!-- Employment history 卡片 -->
      <div class="card section-card">
        <h2>Employment history</h2>
        <p class="sub">
          Show your relevant experience (last 10 years). Use bullet points and
          numbers whenever possible.
        </p>

        <div v-for="(job, i) in jobs" :key="i" class="job-block">
          <header class="job-head">
            <span class="title">{{ job.jobTitle || "(Not specified)" }}</span>
            <button class="del" @click="removeJob(i)" v-if="jobs.length > 1">
              🗑
            </button>
          </header>

          <div class="two-col">
            <label>
              <span>Job Title</span>
              <input v-model="job.jobTitle" />
            </label>
            <label>
              <span>Employer</span>
              <input v-model="job.employer" />
            </label>
          </div>
          <div class="two-col">
            <label>
              <span>Start</span>
              <input type="month" v-model="job.start" />
            </label>
            <label>
              <span>End</span>
              <input type="month" v-model="job.end" />
            </label>
          </div>
          <label>
            <span>City</span>
            <input v-model="job.city" />
          </label>
          <label>
            <span>Description</span>
            <textarea
              v-model="job.desc"
              placeholder="Describe your achievements…（each line a bullet）"
            ></textarea>
          </label>
        </div>

        <button class="add-btn" @click="addJob">＋ Add another position</button>
      </div>
    </section>

    <!-- ---------- 右侧预览区 ---------- -->
    <aside class="preview-pane">
      <button class="tpl-btn">Change template</button>
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
          <h2>Employment history</h2>
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

/* Personal */
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

/* Employment */
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

/* Progress 计算 */
const personalFields = ["jobTitle", "firstName", "lastName", "email", "phone"];
const employmentFields = (refs) =>
  refs.jobTitle || refs.employer || refs.start || refs.desc;
const progressPct = computed(() => {
  let filled = personalFields.filter((f) => personal[f]).length;
  filled += jobs.reduce((sum, j) => sum + (employmentFields(j) ? 1 : 0), 0);
  const total = personalFields.length + jobs.length;
  return Math.round((filled / total) * 100);
});

/* Utils */
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
  