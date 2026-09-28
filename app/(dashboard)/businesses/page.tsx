"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import { BusinessCard } from "@/components/business/BusinessCard";
import { useMyBusinesses, type MyBusiness } from "@/lib/myBusinesses";
import { businessEditPath } from "@/lib/siteRoutes";

/** My Businesses - the listings the signed-in user owns. */
export default function MyBusinessesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isPlaceholderData } = useMyBusinesses(page);

  const businesses = data?.businesses ?? [];
  const pagination = data?.pagination;

  const openBusiness = (business: MyBusiness) => {
    router.push(businessEditPath(business.encrypted_id, business.site?.key));
  };

  return (
    <div className="my-businesses">
      <header className="mb-header">
        <div className="mb-header-text">
          <h1 className="mb-title">My Businesses</h1>
          <p className="mb-sub">
            Traders, services and specialists you manage in the Businesses directory
          </p>
        </div>
        <Link href="/business/create" className="mb-create-btn">
          + Create Business
        </Link>
      </header>

      {error && (
        <div className="mb-state error">
          Couldn’t load your businesses. {error.message}
        </div>
      )}

      {isLoading && !data && <CardGridSkeleton variant="media" count={6} />}

      {!isLoading && businesses.length === 0 && !error && (
        <div className="mb-state">
          <p style={{ margin: 0 }}>You haven’t added a business yet.</p>
          <p style={{ margin: "8px 0 0" }}>
            List your detailing studio, tuning shop, food stall or any other
            automotive business so customers and event organisers can find you.
          </p>
        </div>
      )}

      {businesses.length > 0 && (
        <div
          className="mb-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
            alignItems: "stretch",
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {businesses.map((business) => (
            <BusinessCard
              key={`${business.site?.key ?? ""}:${business.id}`}
              business={business}
              onClick={openBusiness}
            />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="mb-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="mb-page-indicator">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={!pagination.has_more || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
