"use client";

/* ─── Classic CSS Tree Org Chart ────────────────────────────────── */
/* Each <li> gets a ::before vertical line up and ::after horizontal  */
/* line across siblings.  :first-child/:last-child handle edge cuts.  */

function MemberPill({ nama }) {
  return (
    <span className="block text-[11px] leading-tight bg-primary/10 text-primary rounded-md px-2.5 py-0.5 font-medium">
      {nama}
    </span>
  );
}

function NodeInner({ jabatan, members }) {
  const isEmpty = !members?.length;
  return (
    <div
      className={`inline-block bg-card border rounded-lg px-4 py-2 text-center shadow-sm transition-shadow ${
        isEmpty
          ? "border-dashed border-muted-foreground/30"
          : "border-border hover:shadow-md"
      }`}
    >
      <div className="font-bold text-foreground text-[11px] uppercase tracking-widest mb-1">
        {jabatan.nama}
      </div>
      {isEmpty ? (
        <span className="text-[10px] text-muted-foreground italic">(kosong)</span>
      ) : (
        <div className="space-y-0.5">
          {members.map((m) => (
            <MemberPill key={m.id} nama={m.nama} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ jabatan, members, children }) {
  return (
    <li>
      <NodeInner jabatan={jabatan} members={members} />
      {children?.length > 0 && <ul>{children}</ul>}
    </li>
  );
}

export default function OrgChartView({ groups }) {
  if (!groups?.length) return null;

  const [root, child2, child3, ...rest] = groups;

  if (!root) return null;

  const renderNode = (g) => {
    if (!g) return null;
    return <TreeNode key={g.jabatan.id} jabatan={g.jabatan} members={g.members} />;
  };

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="min-w-max flex justify-center">
        <style>{`
          .org-tree ul {
            padding-top: 24px;
            display: flex;
            justify-content: center;
            list-style: none;
            margin: 0;
            padding-inline-start: 0;
            position: relative;
          }
          .org-tree li {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 0 6px;
          }
          /* Vertical line from child UP to parent */
          .org-tree li::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            border-left: 2px solid hsl(var(--border));
            width: 0;
            height: 24px;
          }
          /* Horizontal line across siblings */
          .org-tree li::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border-top: 2px solid hsl(var(--border));
          }
          /* Trim horizontal line at first/last */
          .org-tree li:first-child::after { left: 50%; }
          .org-tree li:last-child::after  { right: 50%; }
          /* Single child – no horizontal line, only vertical */
          .org-tree li:only-child::after,
          .org-tree li:only-child::before { display: none; }
          /* Top-level root gets no line above */
          .org-tree > li::before { display: none; }
        `}</style>

        <ul className="org-tree">
          <TreeNode jabatan={root.jabatan} members={root.members}>
            {child2 && (
              <TreeNode jabatan={child2.jabatan} members={child2.members}>
                {child3 && (
                  <TreeNode jabatan={child3.jabatan} members={child3.members}>
                    {rest.map((g) => (
                      <TreeNode key={g.jabatan.id} jabatan={g.jabatan} members={g.members} />
                    ))}
                  </TreeNode>
                )}
              </TreeNode>
            )}
          </TreeNode>
        </ul>
      </div>
    </div>
  );
}
