import { Observable, ObservableArray, PureComputed } from 'knockout';
import GameHelper from '../GameHelper';

function createObserver(loader: HTMLElement, options: IntersectionObserverInit): { page: Observable<number>, observer: IntersectionObserver} {
    const page = ko.observable(1);

    const callback = (entries) => {
        if (entries[0].isIntersecting) {
            GameHelper.incrementObservable(page);
        }
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(loader);

    return {
        page,
        observer,
    };
}

function findScrollingParent(element: HTMLElement): HTMLElement {
    let elem = element;
    while (elem.parentElement) {
        const { overflowY } = window.getComputedStyle(elem);
        if (overflowY === 'scroll' || overflowY === 'auto') {
            return elem;
        }
        elem = elem.parentElement;
    }

    return elem;
}

function createLoaderElem(): HTMLElement {
    const loader = document.createElement('img');
    loader.src = 'assets/images/pokeball/Pokeball.svg';
    loader.className = 'loader-pokeball';

    return loader;
}

export type LazyLoadOptions = {
    triggerMargin: string; // must be px or %
    threshold: number;
    pageSize: number;
};

const defaultOptions: LazyLoadOptions = {
    triggerMargin: '10%',
    threshold: 1,
    pageSize: 40,
};

const memo = new WeakMap<HTMLElement, PureComputed<Array<unknown>>>();

export default function lazyLoad(element: HTMLElement, list: ObservableArray<unknown>, options?: Partial<LazyLoadOptions>): PureComputed<Array<unknown>> {
    if (memo.has(element)) {
        return memo.get(element);
    }

    const opts = {
        ...defaultOptions,
        ...options,
    };

    const loader = createLoaderElem();
    element.parentElement.append(loader);

    const { page } = createObserver(loader, {
        root: findScrollingParent(element),
        rootMargin: opts.triggerMargin,
        threshold: opts.threshold,
    });

    const lazyList = ko.pureComputed(() => {
        const lastElem = page() * opts.pageSize;

        loader.style.display = lastElem >= list().length ? 'none' : 'initial';

        return list.slice(0, lastElem);
    });

    memo.set(element, lazyList);
    return lazyList;
}
