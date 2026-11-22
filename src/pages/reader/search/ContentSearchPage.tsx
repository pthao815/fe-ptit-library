import SearchResultsPage from "./BookSearchPage";

export default function ContentSearchResultsPage({ empty = false }: { empty?: boolean }) {
  return <SearchResultsPage empty={empty} initialMode="smart" />;
}
