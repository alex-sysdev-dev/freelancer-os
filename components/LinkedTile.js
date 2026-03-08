export default function LinkedTile({ href, className, children, ...rest }) {
  const isExternalLink = typeof href === 'string' && /^https?:\/\//i.test(href);
  const classes = `${className} ${href ? 'block cursor-pointer hover:border-[#5ec7b7] transition-colors' : ''}`;

  if (!href) {
    return (
      <div className={classes} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noreferrer' : undefined}
      className={classes}
      {...rest}
    >
      {children}
    </a>
  );
}
