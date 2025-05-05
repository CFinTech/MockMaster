<template>
  <div class="container">
    <div class="ca-main-section">
      <main id="main-content">
        <div class="layout-flex">
          <!-- Month View -->
          <div id="calendar-container">
            <div class="cal-header">
              <button id="prev-month">&lt;</button>
              <div id="cal-title"></div>
              <button id="next-month">&gt;</button>
            </div>
            <div class="day-names">
              <div>周一</div>
              <div>周二</div>
              <div>周三</div>
              <div>周四</div>
              <div>周五</div>
              <div>周六</div>
              <div>周日</div>
            </div>
            <div id="calendar-grid"></div>
          </div>
          <!-- Daily View -->
          <div id="daily-view">
            <div class="daily-header">
              <button class="daily-back">← 返回</button>
              <div class="daily-title"></div>
            </div>
            <div id="daily-grid"></div>
          </div>
          <!-- Notes -->
          <aside id="notes-sidebar">
            <h3>便签</h3>
            <button id="add-note">＋ 新建</button>
            <div id="notes-list"></div>
          </aside>
        </div>
      </main>
    </div>

    <div id="event-modal" class="modal hidden">
      <div class="modal-content">
        <h3>新建事件</h3>
        <label>
          名称：
          <input type="text" id="evt-title" placeholder="事件名称" />
        </label>
        <label>
          强调色：
          <div id="color-picker">
            <button
              type="button"
              class="color-btn"
              data-color="#f87171"
              style="background: #f87171"
            ></button>
            <button
              type="button"
              class="color-btn"
              data-color="#60a5fa"
              style="background: #60a5fa"
            ></button>
            <button
              type="button"
              class="color-btn"
              data-color="#34d399"
              style="background: #34d399"
            ></button>
            <input
              type="color"
              id="evt-color"
              class="color-btn"
              value="#f87171"
            />
          </div>
        </label>
        <label>
          开始时间：
          <input type="time" id="evt-start" />
        </label>
        <label>
          结束时间：
          <input type="time" id="evt-end" />
        </label>
        <label>
          备注：
          <textarea id="evt-desc" rows="3" placeholder="事件备注"></textarea>
        </label>
        <div class="modal-actions">
          <button id="evt-cancel">取消</button>
          <button id="evt-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Calendar",
  mounted() {
    // 事件数据存储
    const evMap = {};
    let currDate = new Date(),
      currMonth = currDate.getMonth(),
      currYear = currDate.getFullYear();
    const calCont = document.getElementById("calendar-container"),
      dailyView = document.getElementById("daily-view");

    function renderCalendar(m, y) {
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const days = new Date(y, m + 1, 0).getDate();
      const offset = (new Date(y, m, 1).getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) {
        grid.appendChild(document.createElement("div"));
      }
      for (let d = 1; d <= days; d++) {
        const cell = document.createElement("div");
        cell.className = "cal-cell";
        const today = new Date();
        if (
          d === today.getDate() &&
          m === today.getMonth() &&
          y === today.getFullYear()
        ) {
          cell.classList.add("today");
        }
        cell.textContent = d;
        const key = `${y}-${m + 1}-${d}`;
        if (evMap[key]) addEventNames(cell, evMap[key]);
        cell.ondblclick = () => openDaily(d, m, y);
        grid.appendChild(cell);
      }
      document.getElementById("cal-title").textContent = `${y} 年 ${m + 1} 月`;
    }

    document.getElementById("prev-month").onclick = () => {
      currMonth = (currMonth + 11) % 12;
      if (currMonth === 11) currYear--;
      renderCalendar(currMonth, currYear);
    };
    document.getElementById("next-month").onclick = () => {
      currMonth = (currMonth + 1) % 12;
      if (currMonth === 0) currYear++;
      renderCalendar(currMonth, currYear);
    };
    renderCalendar(currMonth, currYear);

    function addEventNames(cell, events) {
      const container = document.createElement("div");
      container.className = "cell-events";
      const maxDisplay = 3;
      events.forEach((e, idx) => {
        if (idx < maxDisplay) {
          const div = document.createElement("div");
          div.className = "event-name";
          div.textContent = e.title;
          container.appendChild(div);
        } else if (idx === maxDisplay) {
          const div = document.createElement("div");
          div.className = "event-name";
          div.textContent = "…";
          container.appendChild(div);
        }
      });
      cell.appendChild(container);
    }

    function openDaily(d, m, y) {
      calCont.style.display = "none";
      dailyView.style.display = "flex";
      document.querySelector(".daily-title").textContent = `${y}年${
        m + 1
      }月${d}日`;
      renderDailyGrid(d, m, y);
    }
    document.querySelector(".daily-back").onclick = () => {
      dailyView.style.display = "none";
      calCont.style.display = "flex";
      renderCalendar(currMonth, currYear);
    };

    function renderDailyGrid(d, m, y) {
      const dg = document.getElementById("daily-grid");
      dg.innerHTML = "";
      for (let h = 0; h < 24; h++) {
        const slot = document.createElement("div");
        slot.className = "time-slot";
        slot.dataset.hour = h;
        slot.style.position = "relative";
        slot.addEventListener("dblclick", () =>
          onSlotDblClick(`${y}-${m + 1}-${d}`, h)
        );
        const lbl = document.createElement("div");
        lbl.className = "time-label";
        lbl.textContent = `${h}:00`;
        slot.append(lbl);
        dg.append(slot);
      }
      const key = `${y}-${m + 1}-${d}`;
      if (evMap[key]) evMap[key].forEach((evt) => createEventBlock(key, evt));
    }

    let currentKey = "",
      currentHour = 0;
    function onSlotDblClick(key, hour) {
      currentKey = key;
      currentHour = hour;
      openEventModal(hour);
    }

    function openEventModal(hour) {
      const modal = document.getElementById("event-modal");
      modal.querySelector("#evt-title").value = "";
      modal.querySelector("#evt-start").value = `${String(hour).padStart(
        2,
        "0"
      )}:00`;
      modal.querySelector("#evt-end").value = `${String(hour + 1).padStart(
        2,
        "0"
      )}:00`;
      modal.querySelector("#evt-desc").value = "";
      document
        .querySelectorAll(".color-btn, #evt-color")
        .forEach((el) => el.classList.remove("selected"));
      document.getElementById("evt-color").value = "#f87171";
      modal.classList.remove("hidden");
    }
    function closeEventModal() {
      document.getElementById("event-modal").classList.add("hidden");
    }
    const colorBtns = document.querySelectorAll(".color-btn");
    const colorInput = document.getElementById("evt-color");
    colorBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        colorBtns.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        colorInput.value = btn.dataset.color;
      })
    );
    colorInput.addEventListener("input", () => {
      colorBtns.forEach((b) => b.classList.remove("selected"));
      colorInput.classList.add("selected");
    });
    document.getElementById("evt-cancel").onclick = closeEventModal;
    document.getElementById("evt-confirm").onclick = () => {
      const title = document.getElementById("evt-title").value.trim();
      const start = document.getElementById("evt-start").value;
      const end = document.getElementById("evt-end").value;
      const desc = document.getElementById("evt-desc").value.trim();
      const color = colorInput.value;
      if (!title || !start || !end) return alert("请填写标题和时间");
      const [sH] = start.split(":").map(Number);
      const [eH] = end.split(":").map(Number);
      const evt = { startHour: sH, endHour: eH, title, desc, color };
      if (!evMap[currentKey]) evMap[currentKey] = [];
      evMap[currentKey].push(evt);
      renderCalendar(currMonth, currYear);
      createEventBlock(currentKey, evt);
      closeEventModal();
    };

    function createEventBlock(key, evt) {
      const titleTxt = document.querySelector(".daily-title").textContent;
      const [y, mo, d] = key.split("-");
      if (titleTxt !== `${y}年${mo}月${d}日`) return;
      const dg = document.getElementById("daily-grid");
      const block = document.createElement("div");
      block.className = "event-block";
      block.style.backgroundColor = evt.color;
      block.style.top = `${evt.startHour * 40}px`;
      block.style.height = `${(evt.endHour - evt.startHour) * 40}px`;
      block.innerHTML = `
        <span class="evt-title">${evt.title}</span>
        <span class="evt-desc">${evt.desc}</span>
      `;
      dg.append(block);
    }

    // Notes 逻辑
    const notesList = document.getElementById("notes-list");
    let dragSrcEl = null;
    function createNote(text = "双击编辑便签内容") {
      const noteEl = document.createElement("div");
      noteEl.className = "note";
      noteEl.draggable = true;
      const textEl = document.createElement("span");
      textEl.className = "note-text";
      textEl.textContent = text;
      textEl.addEventListener("dblclick", () => {
        noteEl.classList.add("editing");
        textEl.contentEditable = "true";
        textEl.focus();
        document.execCommand("selectAll", false, null);
      });
      textEl.addEventListener("blur", () => {
        textEl.contentEditable = "false";
        noteEl.classList.remove("editing");
      });
      textEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          textEl.blur();
        }
      });
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = "&times;";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        noteEl.remove();
      });
      noteEl.addEventListener("dragstart", (e) => {
        dragSrcEl = noteEl;
        e.dataTransfer.effectAllowed = "move";
        noteEl.classList.add("dragging");
      });
      noteEl.addEventListener("dragend", () =>
        noteEl.classList.remove("dragging")
      );
      noteEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        noteEl.classList.add("drag-over");
      });
      noteEl.addEventListener("dragleave", () =>
        noteEl.classList.remove("drag-over")
      );
      noteEl.addEventListener("drop", (e) => {
        e.stopPropagation();
        noteEl.classList.remove("drag-over");
        if (dragSrcEl && dragSrcEl !== noteEl) {
          notesList.insertBefore(dragSrcEl, noteEl);
        }
      });
      noteEl.appendChild(textEl);
      noteEl.appendChild(delBtn);
      return noteEl;
    }
    document.getElementById("add-note").addEventListener("click", () => {
      const note = createNote();
      notesList.appendChild(note);
    });
  },
};
</script>

<style src="../assets/layout.css"></style>
<style src="../assets/calendar.css"></style>