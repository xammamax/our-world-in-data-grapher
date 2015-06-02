<?php
 
use Illuminate\Database\Seeder;
 
class DatasetCategoriesTableSeeder extends Seeder {

	public function run()
	{
		// Uncomment the below to wipe the table clean before populating
		DB::table('dataset_categories')->delete();
		
		//reset autoincrement
		$statement = "ALTER TABLE dataset_categories AUTO_INCREMENT = 1;";
		DB::unprepared($statement);
		
		$dataset_categories = array(
			[ 'name' => 'Population Growth & Vital Statistics' ],
			[ 'name' => 'Health' ],
			[ 'name' => 'Food & Agriculture' ],
			[ 'name' => 'Resources & The Environment' ],
			[ 'name' => 'Technology & Infrastructure' ],
			[ 'name' => 'Growth & Distribution of Prosperity' ],
			[ 'name' => 'Standard of Living' ],
			[ 'name' => 'Economic Development & Work' ],
			[ 'name' => 'The Public Sector' ],
			[ 'name' => 'Global Interconnections' ],
			[ 'name' => 'War & Peace' ],
			[ 'name' => 'Political Regime' ],
			[ 'name' => 'Violence & Rights' ],
			[ 'name' => 'Education & Knowledge' ],
			[ 'name' => 'Media & Communication' ],
			[ 'name' => 'Culture, Values & Society' ],
		);
		
		// Uncomment the below to run the seeder
		DB::table('dataset_categories')->insert($dataset_categories);
	}

}

?>