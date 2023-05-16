import { BRS_URL, MY_PLAN_URL, MY_STUDY_URL, ROSDISTANT_HOSTNAME } from '../constants/urls';
import { IStorage } from '../types/common';
import { getIdFromLinkTag, parseHtmlFromUrl } from '../utils/helpers';
import { parseCourses, parseGrades, parseInfo } from '../utils/parsers';

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
