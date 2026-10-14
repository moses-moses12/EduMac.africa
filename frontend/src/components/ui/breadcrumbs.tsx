'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeHref?: string;
}

export function Breadcrumbs({ items, homeHref = '/dashboard' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-400 font-medium">
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        <li>
          <Link
            href={homeHref}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors p-1 rounded"
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const ItemIcon = item.icon;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center text-slate-600">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                {isLast || !item.href ? (
                  <span className="flex items-center gap-1 text-slate-200 font-semibold px-1 py-0.5">
                    {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-indigo-400" />}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 hover:text-slate-200 transition-colors px-1 py-0.5 rounded"
                  >
                    {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-slate-400" />}
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
