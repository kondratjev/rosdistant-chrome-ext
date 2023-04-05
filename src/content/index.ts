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

const getIdFromLinkTag = (el: Element | null) => {
  return el?.getAttribute('href')?.split('?id=')?.[1];
};

interface ICourse {
  [id: string]: {
    name: string;
    form: string;
  };
}

interface IGrade {
  min: number;
  max: number;
  result: string;
}

interface ITotal {
  courses: ICourse;
  grades: IGrade[];
}

const parseInfo = (doc: Document) => {
  const dataElements = doc.querySelectorAll('#region-main .card-top p');
  return Array.from(dataElements, (item) => item.textContent);
};

const parseCourses = (doc: Document) => {
  const courseElements = doc.querySelectorAll('.card-body .row-fluid');
  const courses = Array.from(courseElements).reduce<ICourse>((acc, el) => {
    const linkEl = el.querySelector('.coursebox a.fancybox-thumb');
    const formEl = el.querySelector('.span3');

    const id = getIdFromLinkTag(linkEl);

    if (id && linkEl?.textContent && formEl?.textContent) {
      acc[id] = {
        name: linkEl.textContent.trim(),
        form: formEl.textContent.trim(),
      };
    }
    return acc;
  }, {});
  return courses;
};

const parseGrades = (doc: Document) => {
  const tableRows = doc.querySelectorAll('.panel-body .row-fluid');
  const grades = Array.from(tableRows).reduce<IGrade[]>((acc, el) => {
    const [min, max] = el.firstChild?.textContent?.split('-') ?? ['0', '0'];
    const result = el.lastChild?.textContent;
    if (result) {
      acc.push({
        min: parseInt(min),
        max: parseInt(max),
        result,
      });
    }

    return acc;
  }, []);
  return grades;
};

if (window.location.hostname === 'edu.rosdistant.ru') {
  const data = (await chrome.storage.sync.get(['courses', 'grades'])) as ITotal;
  if (!data.courses) {
    const doc = await parseHtmlFromUrl('/my/plan/');
    if (doc instanceof Document) {
      const info = parseInfo(doc);
      const courses = parseCourses(doc);
      await chrome.storage.sync.set({ info, courses });
    }
  }

  if (!data.grades?.length) {
    const doc = await parseHtmlFromUrl('/local/lk/brs.php');
    if (doc instanceof Document) {
      const grades = parseGrades(doc);
      await chrome.storage.sync.set({ grades });
    }
  }

  if (window.location.pathname === '/my/study/') {
    const data = (await chrome.storage.sync.get(['courses', 'grades'])) as ITotal;

    const courseElements = document.querySelectorAll('.mycourses');
    courseElements.forEach((courseEl) => {
      // Replace class
      const courseboxElement = courseEl.querySelector('.coursebox');
      courseboxElement?.classList?.replace('span8', 'span6');

      const linkEl = courseEl.querySelector('.coursename a');
      const id = getIdFromLinkTag(linkEl);

      if (id) {
        const form = data.courses[id]?.form;

        if (form) {
          // Add form
          const node = document.createElement('li');
          node.innerHTML = form;
          courseEl?.querySelector('.teachers')?.appendChild(node);

          // Add grade
          const result = courseEl.lastElementChild?.textContent?.split(': ')?.[1];
          if (result) {
            const parsedResult = parseInt(result);
            const foundResult = data.grades.find(
              (res) => res.min <= parsedResult && res.max >= parsedResult,
            );

            const span = document.createElement('span');
            span.style.display = 'block';
            span.innerHTML = 'Оценка:';

            const container = document.createElement('div');
            container.style.textAlign = 'center';
            container.className = 'rank span2';
            container.appendChild(span);
            container.append(foundResult!.result);

            courseEl.appendChild(container);
          }
        }
      }
    });
  }
}

export {};
