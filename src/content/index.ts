import { BRS_URL, MY_PLAN_URL, MY_STUDY_URL, ROSDISTANT_HOSTNAME } from '../constants/urls';
import { ICourse, IGrade, IStorage } from '../types/common';

const parseHtmlFromUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  } catch {
    return new Error('Error while parsing HTML');
  }
};

const getIdFromLinkTag = (el: HTMLLinkElement | null) => {
  return el?.href?.replace(/[^0-9]/g, '');
};

const parseInfo = (doc: Document) => {
  const infoElements = doc.querySelectorAll<HTMLParagraphElement>('#region-main .card-top p');
  return Array.from(infoElements, (info) => info?.textContent?.trim());
};

const parseCourses = (doc: Document) => {
  const courseElements = doc.querySelectorAll('.card-body .row-fluid');
  const courses = Array.from(courseElements).reduce<ICourse>((acc, el) => {
    const linkEl = el.querySelector<HTMLLinkElement>('.coursebox a.fancybox-thumb');
    const formEl = el.querySelector<HTMLSpanElement>('.span3');

    const id = getIdFromLinkTag(linkEl);
    const name = linkEl?.textContent?.trim();
    const form = formEl?.textContent?.trim();

    if (id && name && form) {
      acc[id] = {
        name,
        form,
      };
    }

    return acc;
  }, {});
  return courses;
};

const parseGrades = (doc: Document) => {
  const tableRows = doc.querySelectorAll<HTMLDivElement>('.panel-body .row-fluid');
  const grades = Array.from(tableRows).reduce<IGrade[]>((grades, el) => {
    const scoresRange = el.firstElementChild?.textContent?.trim();
    const grade = el.lastElementChild?.textContent?.trim();

    if (scoresRange && grade) {
      const [min, max] = scoresRange.split('-');
      grades.push({
        min: parseInt(min),
        max: parseInt(max),
        result: grade,
      });
    }

    return grades;
  }, []);
  return grades;
};

if (window.location.hostname === ROSDISTANT_HOSTNAME) {
  const data = (await chrome.storage.sync.get(['courses', 'grades'])) as IStorage;

  if (!data.courses) {
    const doc = await parseHtmlFromUrl(MY_PLAN_URL);
    if (doc instanceof Document) {
      const info = parseInfo(doc);
      const courses = parseCourses(doc);
      await chrome.storage.sync.set({ info, courses });
    }
  }

  if (!data.grades?.length) {
    const doc = await parseHtmlFromUrl(BRS_URL);
    if (doc instanceof Document) {
      const grades = parseGrades(doc);
      await chrome.storage.sync.set({ grades });
    }
  }

  if (window.location.pathname === MY_STUDY_URL) {
    const data = (await chrome.storage.sync.get(['courses', 'grades'])) as IStorage;

    // Replace main row spans
    const mainRowEl = document.querySelector<HTMLDivElement>('#region-main .row-fluid');
    mainRowEl?.firstElementChild?.classList?.replace('span8', 'span9');
    mainRowEl?.lastElementChild?.classList?.replace('span4', 'span3');

    const courseElements = mainRowEl?.querySelectorAll<HTMLDivElement>('.mycourses');
    courseElements?.forEach((courseEl) => {
      // Replace classes for each course
      const courseboxElement = courseEl.querySelector<HTMLDivElement>('.coursebox');
      courseboxElement?.classList?.replace('span8', 'span6');

      const linkEl = courseboxElement?.querySelector<HTMLLinkElement>('.coursename a');
      if (linkEl) {
        const id = getIdFromLinkTag(linkEl);
        if (id) {
          // Add form of course
          const form = data.courses?.[id]?.form;
          if (form) {
            const listNode = document.createElement('li');
            listNode.innerHTML = form;
            courseboxElement?.querySelector<HTMLUListElement>('.teachers')?.appendChild(listNode);
          }

          // Add grade
          const score = courseEl.lastElementChild?.textContent?.replace(/[^0-9]/g, '');
          if (score) {
            const parsedScore = parseInt(score);
            const foundGrade = data.grades?.find(
              (grade) => grade.min <= parsedScore && grade.max >= parsedScore,
            );
            if (foundGrade?.result) {
              const span = document.createElement('span');
              span.style.display = 'block';
              span.innerHTML = 'Оценка:';

              const container = document.createElement('div');
              container.style.textAlign = 'center';
              container.className = 'rank span2';
              container.appendChild(span);
              container.append(foundGrade.result);

              courseEl.appendChild(container);
            }
          }
        }
      }
    });
  }
}

export {};
