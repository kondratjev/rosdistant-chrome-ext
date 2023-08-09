import { ICourse, IGrade } from '../types/common';
import { getIdFromLinkTag } from './helpers';

export const parseInfo = (doc: Document) => {
  const infoElements = doc.querySelectorAll<HTMLParagraphElement>('#region-main .card-top p');
  return Array.from(infoElements, (info) => info?.textContent?.trim());
};

export const parseCourses = (doc: Document) => {
  let courses = {};
  const semesters = doc.querySelectorAll('.tab-pane');
  semesters.forEach((semester) => {
    const courseElements = semester.querySelectorAll('.card-body .row-fluid');
    courses = Array.from(courseElements).reduce<ICourse>((acc, el) => {
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
    }, courses);
  });
  return courses;
};

export const parseGrades = (doc: Document) => {
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
