import { Helmet } from 'react-helmet-async';
import { AutoComplete } from '../../components/autocomplete/autocomplete.component';
import './home.page.scss';

export function HomePage() {
  return (
    <div id="home-page">
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="Starter Application for React projects" />
      </Helmet>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 col-md-8">
            Write Cool Code
            <AutoComplete></AutoComplete>
          </div>
          <div className="col-12 col-md-4">Sidebar</div>
        </div>
      </div>
    </div>
  );
}
